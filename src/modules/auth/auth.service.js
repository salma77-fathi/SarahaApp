import {
  providerEnum,
  roleEnum,
  UserModel,
} from "../../DB/models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/reponse.js";
import * as DBservice from "../../DB/db.service.js";
import {
  generateHash,
  compareHash,
} from "../../utils/security/hash.security.js";
import { generateEncrption } from "../../utils/security/encryption.security.js";
import {
  generateToken,
  getSignature,
  signatureTypeEnum,
  verifyToken,
} from "../../utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../../utils/Email/send.email.js";
import { customAlphabet } from "nanoid";
import { emailEvent } from "../../utils/Events/email.event.js";
import { emailTemplate } from "../../utils/Email/email.template.js";
import { RevokeTokenModel } from "../../DB/models/revoke.token.model.js";
import { error } from "node:console";
//helper methods
async function verify(idToken) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}
async function generateLoginToken(user, res) {
  const signature = await getSignature({
    signatureLevel:
      user.role != roleEnum.user
        ? signatureTypeEnum.system
        : signatureTypeEnum.bearer,
  });
  const access_token = await generateToken({
    signature: signature.accessSignature,
    payload: { _id: user._id },
  });
  //it takes payload "not important data"
  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signature.refreshSignature,
    options: { expiresIn: process.env.REFRESH_EXPIRES_IN },
  });
  res.cookie("refreshToken", refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: "Strict",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  return { access_token, refresh_token };
}
//system authentication

export const signup = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone } = req.body;
  const checkUserExist = await DBservice.findOne({
    model: UserModel,
    filter: { email },
  });
  if (checkUserExist) {
    return next(new Error("email is exist", { cause: 409 }));
  }
  const encPhone = await generateEncrption({ plaintext: phone });
  const hashPassword = await generateHash({ plaintext: password });
  const otp = customAlphabet("123456789", 4)();
  const hashOtp = await generateHash({ plaintext: otp });
  const user = await DBservice.create({
    model: UserModel,
    data: [
      {
        fullName,
        email,
        password: hashPassword,
        phone: encPhone,
        confirmEmailOtp: hashOtp,
      },
    ],
  });
  emailEvent.emit("confirmEmail", { email, otp });

  return successResponse({ res, status: 201, data: { user } });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.system },
  });
  if (!user) {
    return next(new Error("in-valid email or provider", { cause: 404 }));
  }
  if (!user.confirmEmail) {
    return next(
      new Error("please verify your email address first", { cause: 400 })
    );
  }

  const match = await compareHash({
    plaintext: password,
    hashValue: user.password,
  });
  // console.log({ password, DB: user.password, match });
  if (!match) {
    return next(new Error("In-valid Email or Password", { cause: 404 }));
  }
  const data = await generateLoginToken(user, res);
  return successResponse({ res, data });
});
export const refreshTokenController = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return next(new Error("No refresh token provided", { cause: 401 }));
  }
  const decoded = await verifyToken({
    token: token,
    signature: signature.refreshSignature,
    //process.env.REFRESH_TOKEN_SIGNATURE,
  });
  const newAccessToken = await generateToken({
    payload: { _id: decoded._id },
    options: { expiresIn: process.env.ACCESS_EXPIRES_IN },
  });
  return successResponse({ res, data: { access_token: newAccessToken } });
});
//google-provider authentication
export const signupWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email, email_verified, name, picture } = await verify(idToken);

  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }

  const user = await DBservice.findOne({ model: UserModel, filter: { email } });

  if (user) {
    return next(new Error("User already exists", { cause: 409 }));
  }

  const newUser = await DBservice.create({
    model: UserModel,
    data: [
      {
        confirmEmail: Date.now(),
        fullName: name,
        email,
        picture,
        provider: providerEnum.google,
      },
    ],
  });
  return successResponse({ res, status: 201, data: { user: newUser } });
});
export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const { email, email_verified } = await verify(idToken);
  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }
  const user = await DBservice.findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.google },
  });
  if (!user) {
    return next(
      new Error("In-valid Login data In-valid email or provider", {
        cause: 404,
      })
    );
  }
  const data = await generateLoginToken(user);
  return successResponse({ res, data });
});
export const sendEmailConfirmationCode = asyncHandler(
  async (req, res, next) => {
    const { email } = req.body;

    const user = await DBservice.findOne({
      model: UserModel,
      filter: {
        email,
        provider: providerEnum.system,
      },
    });

    if (!user) {
      return next(new Error("Invalid account", { cause: 404 }));
    }

    if (
      user.confirmEmailOtpBlockedUntil &&
      user.confirmEmailOtpBlockedUntil > Date.now()
    ) {
      const waitSeconds = Math.ceil(
        (user.confirmEmailOtpBlockedUntil - Date.now()) / 1000
      );
      return next(
        new Error(`You are blocked. Try again in ${waitSeconds} seconds.`, {
          cause: 429,
        })
      );
    }

    const generateOtp = customAlphabet("0123456789", 6);
    const otp = generateOtp();
    const hashedOtp = await generateHash({ plaintext: otp });

    await DBservice.updateOne({
      model: UserModel,
      filter: { email },
      data: {
        confirmEmailOtp: hashedOtp,
        confirmEmailOtpCreatedAt: new Date(),
        confirmEmailOtpExpires: new Date(Date.now() + 2 * 60 * 1000),
        confirmEmailOtpAttempt: 0,
        confirmEmailOtpBlockedUntil: null,
      },
    });

    emailEvent.emit("confirmEmail", { email, otp });

    return successResponse({
      res,
      message: "Verification code sent successfully",
    });
  }
);
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      provider: providerEnum.system,
      confirmEmailOtp: { $exists: true },
    },
  });

  if (!user) {
    return next(new Error("Invalid account", { cause: 404 }));
  }

  if (
    user.confirmEmailOtpBlockedUntil &&
    user.confirmEmailOtpBlockedUntil > Date.now()
  ) {
    const waitSeconds = Math.ceil(
      (user.confirmEmailOtpBlockedUntil - Date.now()) / 1000
    );
    return next(
      new Error(`You are blocked. Try again in ${waitSeconds} seconds.`, {
        cause: 429,
      })
    );
  }

  const createdAt = new Date(user.confirmEmailOtpCreatedAt).getTime();
  const now = Date.now();
  if (now - createdAt > 2 * 60 * 1000) {
    return next(new Error("OTP expired", { cause: 410 }));
  }

  const match = await compareHash({
    plaintext: otp,
    hashValue: user.confirmEmailOtp,
  });

  if (!match) {
    let updateData = {};

    if (user.confirmEmailOtpAttempt + 1 >= 5) {
      updateData.$set = {
        confirmEmailOtpBlockedUntil: new Date(Date.now() + 5 * 60 * 1000),
        confirmEmailOtpAttempt: 0,
      };
    } else {
      updateData.$inc = { confirmEmailOtpAttempt: 1 };
    }

    await DBservice.updateOne({
      model: UserModel,
      filter: { email },
      data: updateData,
    });

    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  await DBservice.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $set: { confirmEmail: new Date() },
      $unset: {
        confirmEmailOtp: 1,
        confirmEmailOtpCreatedAt: 1,
        confirmEmailOtpAttempt: 1,
        confirmEmailOtpBlockedUntil: 1,
      },
    },
  });

  return successResponse({ res, message: "Email confirmed successfully" });
});
export const sendForgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await generateHash({ plaintext: otp });
  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      freezedAt: { $exists: false },
      confirmEmail: { $exists: true },
    },
    data: {
      forgotCode: hashOtp,
    },
  });
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  emailEvent.emit("forgotPassword", { email, otp });
  return successResponse({ res, data: {} });
});

export const verifyForgotCode = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      freezedAt: { $exists: false },
      confirmEmail: { $exists: true },
    },
  });
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const isMatch = await compareHash({
    plaintext: otp,
    hashValue: user.forgotCode,
  });
  if (!isMatch) {
    return next(new Error("Invalid otp", { cause: 400 }));
  }
  return successResponse({ res, data: {} });
});

export const resetForgotPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: {
      email,
      freezedAt: { $exists: false },
      confirmEmail: { $exists: true },
    },
  });
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const isMatch = await compareHash({
    plaintext: otp,
    hashValue: user.forgotCode,
  });
  if (!isMatch) {
    return next(new Error("Invalid otp", { cause: 400 }));
  }
  const hashPassword = await generateHash({ plaintext: newPassword });
  await DBservice.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $set: { password: hashPassword, changeLoginCredentials: Date.now() },
      $unset: { forgotCode: 1 },
      $inc: { __v: 1 },
    },
  });
  return successResponse({ res, data: {} });
});
// export const testCronJob = asyncHandler(async (req, res, next) => {
//       const result = await DBservice.deleteMany({
//       model: RevokeTokenModel,
//       filter: {
//         $and: [
//           { expiresAccessTokenDate: { $lt: new Date() } },
//           { expiresRefreshDate: { $lt: new Date() } },
//         ],
//       },
//     });
//     return successResponse({ res, data: {result} });
// })
