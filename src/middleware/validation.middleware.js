import { asyncHandler } from "../utils/reponse.js";
import joi from "joi";
import { Types } from "mongoose";
export const generalFields = {
  fullName: joi.string().min(2).max(20).messages({
    // note=> in string min & max as a length but in number as value
    "string.empty": "Please enter your full name",
    "string.min": "min length is 2",
    "any.required": "full name is required",
  }),
  email: joi.string().email({
    maxDomainSegments: 2,
    maxDomainSegments: 3,
    tlds: { allow: ["com", "net"] },
  }), //here maxDomainSegments by default is 2 , tlds(topleveldomains) is an array of strings
  password: joi
    .string()
    .pattern(
      new RegExp(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
    ),
  confirmPassword: joi.string().valid(joi.ref("password")), // here confirmPassword is a reference to the password field to ensure they are the same.
  phone: joi.string().pattern(new RegExp(/^(01)[0-2,5]{1}[0-9]{8}$/)),
  otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
  id: joi.string().custom((value, helper) => {
    // console.log({ value, match: Types.ObjectId.isValid(value), helper });

    return Types.ObjectId.isValid(value)
      ? true
      : helper.message("Invalid mongoDB ID");
  }),
  file: {
    fieldname: joi.string(),
    originalname: joi.string(),
    encoding: joi.string(),
    mimetype: joi.string(),
    destination: joi.string(),
    filename: joi.string(),
    path: joi.string(),
    size: joi
      .number()
      .positive()
      .min(1)
      .max(5 * 1024 * 1024),
  },
};
export const validation = (schema) => {
  return asyncHandler(async (req, res, next) => {
    // console.log(req.file);

    // console.log(schema);
    // console.log(Object.keys(schema));
    const validationErrors = [];
    for (const key of Object.keys(schema)) {
      // console.log(key);

      const validationResult = schema[key].validate(req[key], {
        abortEarly: false,
      }); //when it false allowing all errors to be shown
      if (validationResult.error) {
        validationErrors.push(validationResult.error?.details);
      }
    }
    // console.log({ validationErrors });

    if (validationErrors.length) {
      return res
        .status(400)
        .json({ message: "validation error", error: validationErrors });
    }
    return next();
  });
};
