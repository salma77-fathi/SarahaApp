import { asyncHandler, successResponse } from "../../utils/reponse.js";
import * as DBservice from "../../DB/db.service.js";
import { UserModel } from "../../DB/models/User.model.js";
import { MessageModel } from "../../DB/models/message.model.js";
import { deleteResources, uploadFiles } from "../../utils/multer/cloudinary.js";
export const sendMessage = asyncHandler(async (req, res, next) => {
  if (!req.body.content && !req.files) {
    return next(
      new Error("content or attachments are required", { cause: 400 })
    );
  }
  const { receiverId } = req.params;
  if (
    !(await DBservice.findOne({
      model: UserModel,
      filter: {
        _id: receiverId,
        freezedAt: { $exists: false },
        confirmEmail: { $exists: true },
      },
    }))
  ) {
    return next(new Error("invalid recipient account", { cause: 404 }));
  }
  const { content } = req.body;
  let attachments = [];
  if (req.files) {
    attachments = await uploadFiles({
      files: req.files,
      path: `message/${receiverId}`,
    });
  }
  // console.log({ params: req.params, body: req.body, files: req.files?.length });

  const message = await DBservice.create({
    model: MessageModel,
    data: [
      {
        content,
        attachments,
        receiverId,
        senderId: req.user._id,
      },
    ],
  });
  return successResponse({
    res,
    status: 201,
    data: { message },
  });
});

export const getMessageById = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const message = await DBservice.findById({
    model: MessageModel,
    id: messageId,
  });
  if (!message) {
    return next(new Error("Message not found", { cause: 404 }));
  }
  return successResponse({ res, data: { message } });
});
export const softDeleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  const userUpdated = await DBservice.findOneAndUpdate({
    model: MessageModel,
    filter: {
      _id: messageId,
      senderId: userId,
      deletedAt: { $exists: false },
    },
    data: {
      $set: { deletedAt: Date.now(), deletedBy: userId },
    },
    options: {
      new: true,
    },
  });
  if (!userUpdated) {
    return next(
      new Error("Message not found or you are not the owner", { cause: 404 })
    );
  }
  return successResponse({ res, data: { userUpdated } });
});

export const hardDeleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  const message = await DBservice.deleteOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      senderId: userId,
      deletedAt: { $exists: true},
    },
  });
  if (!message.deletedCount) {
    return next(
      new Error("Message not found or not soft-deleted", { cause: 404 })
    );
  }
  return successResponse({ res, data: { message } });
});
