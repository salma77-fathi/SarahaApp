import jwt from "jsonwebtoken";
import * as DBserivce from "../../DB/db.service.js";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import { nanoid } from "nanoid";
import { RevokeTokenModel } from "../../DB/models/revoke.token.model.js";
export const signatureTypeEnum = { system: "System", bearer: "Bearer" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };

const tokenId = nanoid();
export const generateToken = async ({
  payload = {},
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
  options = { expiresIn: process.env.ACCESS_EXPIRES_IN, jwtid: tokenId },
} = {}) => {
  return jwt.sign(payload, signature, options);
};
export const verifyToken = async ({
  token = "",
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
} = {}) => {
  return jwt.verify(token, signature);
};
/*
______________________notes_______________________________
>user(bearer)=> this is the key i take from the token,
>admin(system)=> this is the key i take from the token
*/
export const getSignature = async ({
  signatureLevel = signatureTypeEnum.bearer,
} = {}) => {
  let signatures = {
    accessSignature: undefined,
    refreshSignature: undefined,
  };

  switch (signatureLevel) {
    case signatureTypeEnum.system:
      signatures.accessSignature = process.env.ACCESS_TOKEN_SYSTEM_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_SYSTEM_SIGNATURE;
      break;

    default:
      signatures.accessSignature = process.env.ACCESS_TOKEN_USER_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_TOKEN_USER_SIGNATURE;
      break;
  }
  //console.log({signatures});

  return signatures;
};

export const decodedToken = async ({
  authorization = "",
  tokenType = tokenTypeEnum.access,
  next,
} = {}) => {
  // console.log(authorization);
  const [bearer, token] = authorization?.split(" ") || [];
  if (!token || !bearer) {
    return next(new Error("missing token parts"));
  }
  // console.log({ bearer, token });
  const signatures = await getSignature({ signatureLevel: bearer });
  const decoded = await verifyToken({
    signature:
      tokenType === tokenTypeEnum.access
        ? signatures.accessSignature
        : signatures.refreshSignature,
    token,
  });
  // console.log({
  //   accessSignature: signatures.accessSignature,
  //   refreshSignature: signatures.refreshSignature,
  // });
  // console.log({ signatures });

  if (!decoded?._id) {
    return next(new Error("In-valid token", { cause: 400 }));
  }

  if (await DBserivce.findOne({  model: RevokeTokenModel,filter: { idToken: decoded.jti }})) 
    {
    return next(new Error("user have signed out from this device", { cause: 401}));
  }
  //to make sure that user is exist in DB
  const user = await DBserivce.findById({
    model: UserModel,
    id: decoded._id,
  });

  if (!user) {
    return next(new Error("not register account", { cause: 404 }));
  }
  console.log({
    iat: decoded.iat * 1000,
    userCredentials: new Date(user.changeLoginCredentials).getTime(),
  });
  if (
    user.changeLoginCredentials &&
    decoded.iat * 1000 < new Date(user.changeLoginCredentials).getTime()
  ) {
    return next(new Error("old login credential ", { cause: 401 }));
  }

  return { user, decoded };
};

export const getLoginCredentials = async ({ user } = {}) => {
  const signatures = await getSignature({
    signatureLevel:
      user.role != roleEnum.user
        ? signatureTypeEnum.system
        : signatureTypeEnum.bearer,
  });
  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.accessSignature,
    options: {
      expiresIn: Number(process.env.ACCESS_EXPIRES_IN),
      jwtid: tokenId,
    },
  });
  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.refreshSignature,
    options: {
      expiresIn: Number(process.env.REFRESH_EXPIRES_IN),
      jwtid: tokenId,
    },
  });
  return { access_token, refresh_token };
};
