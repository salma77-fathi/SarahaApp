import { asyncHandler } from "../utils/reponse.js";
import {
  decodedToken,
  getSignature,
  tokenTypeEnum,
  verifyToken,
} from "../utils/security/token.security.js";
import * as DBserivce from "../DB/db.service.js";
import { UserModel } from "../DB/models/User.model.js";
export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
  return asyncHandler(async (req, res, next) => {
    const { user, decoded } = await decodedToken({
      authorization: req.headers.authorization,
      next,
      tokenType,
    });
    req.user = user;
    req.decoded = decoded;
    return next();
  });
};
export const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    console.log({
      accessRoles,
      role: req.user.role,
      result: accessRoles.includes(req.user.role),
    });

    if (accessRoles.length && !accessRoles.includes(req.user.role)) {
      return next(new Error("not authorized account ", { cause: 403 }));
    }
    return next();
  });
};
