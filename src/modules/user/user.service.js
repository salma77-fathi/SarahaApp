import { asyncHandler, successResponse } from "../../utils/reponse.js";
import * as DBservice from "../../DB/db.service.js";
import { roleEnum, UserModel } from "../../DB/models/User.model.js";
import {
  cloud,
  destroyFile,
  uploadFile,
  uploadFiles,
  deleteResources,
  deleteFolderByPrefix,
} from "../../utils/multer/cloudinary.js";
import {
  decrytEncrption,
  generateEncrption,
} from "../../utils/security/encryption.security.js";
import { getLoginCredentials } from "../../utils/security/token.security.js";
import {
  compareHash,
  generateHash,
} from "../../utils/security/hash.security.js";
import { AwsClient } from "google-auth-library";
import { RevokeTokenModel } from "../../DB/models/revoke.token.model.js";
export const profile = asyncHandler(async (req, res, next) => {
  const user = await DBservice.findById({
    model: UserModel,
    id: req.user._id,
    populate: [{ path: "messages" }],
  });
  user.phone = await decrytEncrption({ ciphertext: req.user.phone });
  return successResponse({ res, data: { user: req.user } });
});
export const shareProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await DBservice.findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "-password -role",
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("Not register account ", { cause: 404 }));
});
export const updateBasicProfile = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = await generateEncrption({ plaintext: req.body.phone });
  }
  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: { $set: req.body, $inc: { __v: 1 } },
  });
  return user
    ? successResponse({ res, data: { user } })
    : next(new Error("Not register account ", { cause: 404 }));
});
export const freezeAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("Not authorized to perform this action ", { cause: 403 })
    );
  }
  //**************NoteForYou**********************/
  //  { _id: userId }=>admin freeze user account
  // { _id: req.user._id }=>either admin or user  will freeze his account;

  const user = await DBservice.updateOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: false },
    },
    data: {
      $set: {
        freezedAt: Date.now(),
        freezedBy: req.user._id,
      },
      $inc: { __v: 1 },
    },
  });
  // console.log("UserID:", userId);

  return user.matchedCount
    ? successResponse({ res, data: { user } })
    : next(new Error("not register account ", { cause: 404 }));
});
export const restoreAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("Not authorized to perform this action ", { cause: 403 })
    );
  }
  const user = await DBservice.updateOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: true },
    },
    data: {
      $set: {
        restoredBy: req.user._id,
      },
      $unset: {
        freezedAt: 1,
        freezedBy: 1,
      },
      $inc: { __v: 1 },
    },
  });
  return user.matchedCount
    ? successResponse({ res, data: { user } })
    : next(new Error("not register account ", { cause: 404 }));
});
export const hardDeleteAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId && req.user.role !== roleEnum.admin) {
    return next(
      new Error("Not authorized to perform this action ", { cause: 403 })
    );
  }
  const user = await DBservice.deleteOne({
    model: UserModel,
    filter: {
      _id: userId || req.user._id,
      freezedAt: { $exists: true }, //must be freeze first
    },
  });
  if (user.deletedCount) {
    await deleteFolderByPrefix({ prefix: `user/${userId}` });
  }
  return user.deletedCount
    ? successResponse({ res, data: { user } })
    : next(new Error("not register account ", { cause: 404 }));
});
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await DBservice.findById({ model: UserModel, id: req.user._id });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  const isMatch = await compareHash({
    plaintext: oldPassword,
    hashValue: req.user.password,
  });
  if (!isMatch) {
    return next(new Error("Incorrect password"));
  }
  const hashPassword = await generateHash({
    plaintext: newPassword,
  });
  for (const hash of req.user.oldPasswords || []) {
    if (isMatch) {
      return next(new Error("you have used this password before"));
    }
  }
  const userUpdate = await DBservice.updateOne({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      $set: {
        password: hashPassword,
        changeLoginCredentials: Date.now(),
      },
      $push: { oldPasswords: req.user.password },
      $inc: { __v: 1 },
    },
  });
  return successResponse({
    res,
    message: "Password updated successfully",
    data: { userUpdate },
  });
});
export const logout = asyncHandler(async (req, res, next) => {
  // console.log(req.decoded);
  await DBservice.create({
    model: RevokeTokenModel,
    data: [
      {
        idToken: req.decoded.jti,
        expiresAccessDate: req.decoded.exp,
        expiresRefreshDate: req.decoded.iat + 31536000,
      },
    ],
  });

  return successResponse({ res, data: {} });
});
export const profileCoverImage = asyncHandler(async (req, res, next) => {
  // console.log({ serviceFile: req.files }); //look ""file"" here like body or params
  //array of files
  let attachments = uploadFiles({
    files: req.files,
    path: `user/${req.user._id}/cover`,
  });

  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      cover: attachments,
    },
    options: {
      new: false,
    },
  });
  if (user?.cover?.length) {
    return await deleteResources({
      public_ids: user.cover.map((item) => item.public_id),
    });
  }
  return successResponse({ res, data: { user } });
});
export const profileImage = asyncHandler(async (req, res, next) => {
  // console.log({ serviceFile: req.file }); //look ""file"" here like body or params
  const { secure_url, public_id } = await uploadFile({
    file: req.file,
    path: `User/${req.user._id}`,
  });
  const user = await DBservice.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      picture: { secure_url, public_id }, //for one file
    },
    options: {
      new: false,
    },
  });
  if (user?.picture?.public_id) {
    await destroyFile({ public_id: user.picture.public_id });
  }

  return successResponse({ res, data: { user } });
});

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
  const credentials = await getLoginCredentials({ user: req.user });
  return successResponse({ res, data: { credentials } });
});
