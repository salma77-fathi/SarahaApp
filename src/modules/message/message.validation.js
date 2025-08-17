import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { fileValidators } from "../../utils/multer/cloud.multer.js";
export const sendMessage = {
  params: joi
    .object()
    .keys({
      receiverId: generalFields.id.required(),
    })
    .required(),

  body: joi
    .object()
    .keys({
      content: joi.string().min(2).max(20000),
    })
    .required(),

  files: joi
    .array()
    .items(
      joi.object().keys({
        fieldname: generalFields.file.filename.valid("attachments").required(),
        originalname: generalFields.file.originalname.required(),
        encoding: generalFields.file.encoding.required(),
        mimetype: generalFields.file.mimetype
          .valid(...fileValidators.image)
          .required(),
        destination: generalFields.file.destination.required(),
        filename: generalFields.file.fieldname.required(),
        path: generalFields.file.path.required(),
        size: generalFields.file.size.required(),
      })
    )
    .min(0)
    .max(2),
};
