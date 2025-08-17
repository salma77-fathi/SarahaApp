import joi from "joi";
import { fileValidators   } from "../../utils/multer/cloud.multer.js";

import { generalFields } from "../../middleware/validation.middleware.js";
import { genderEnum } from "../../DB/models/User.model.js";
export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalFields.id.required(),
    })
    .required(),
};

export const updateBasicProfile = {
  params: joi
    .object()
    .keys({
      firstName: generalFields.fullName,
      secondName: generalFields.fullName,
      phone: generalFields.phone,
      gender: joi.string().valid(...Object.values(genderEnum)),
    })
    .required(),
};

export const freezeAccount = {
  params: joi
    .object()
    .keys({
      userId: generalFields.id,
    })
    .required(),
};

export const restoreAccount = freezeAccount;

export const updatePassword = {
  body: joi
    .object()
    .keys({
      oldPassword: generalFields.password.required(),
      newPassword: generalFields.password
        .not(joi.ref("oldPassword"))
        .required(),
      confirmPassword: generalFields.confirmPassword.required(),
    })
    .required(),
};

export const profileImage = {
  file: joi
    .object()
    .keys({
      fieldname: generalFields.file.filename.valid("image").required(),
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
    .required(),
};
export const profileCoverImage = {
  files: joi
    .array()
    .items(
      joi.object().keys({
        fieldname: generalFields.file.filename.valid("images").required(),
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

    .required(),
};

// export const profileCoverImage = {
//   files: joi
//     .object()
//     .keys({
//       images: joi
//         .array()
//         .items(
//           joi
//             .object()
//             .keys({
//               fieldname: joi.string().valid("images").required(),
//               originalname: joi.string().required(),
//               encoding: joi.string().required(),
//               mimetype: joi
//                 .string()
//                 .valid(...localFileValidators.image)
//                 .required(),
//               destination: joi.string().required(),
//               filename: joi.string().required(),
//               path: joi.string().required(),
//               size: joi
//                 .number()
//                 .positive()
//                 .min(1)
//                 .max(5 * 1024 * 1024)
//                 .required(), // max size 5MB
//             })
//             .required()
//         )
//         .min(1)
//         .max(2)
//         .required(),
//       certificates: joi
//         .array()
//         .ordered(
//           joi
//             .object()
//             .keys({
//               fieldname: joi.string().valid("certificates").required(),
//               originalname: joi.string().required(),
//               encoding: joi.string().required(),
//               mimetype: joi
//                 .string()
//                 .valid(localFileValidators.document[0])
//                 .required(),
//               destination: joi.string().required(),
//               filename: joi.string().required(),
//               path: joi.string().required(),
//               size: joi
//                 .number()
//                 .positive()
//                 .min(1)
//                 .max(5 * 1024 * 1024)
//                 .required(), // max size 5MB
//             })
//             .required()
//         )
//         .length(1)
//         .required(),
//     })
//     .required(),
// };
