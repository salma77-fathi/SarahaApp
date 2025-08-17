import { Router } from "express";
import * as userService from "./user.service.js";
import {
  authentication,
  authorization,
} from "../../middleware/authentiaction.middleware.js";
import { endPoint } from "./authorization.user.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as authValidation from "./user.validation.js";
import {
  cloudFileUpload,
  fileValidators,
} from "../../utils/multer/cloud.multer.js";
const router = Router();
router.get(
  "/",
  authentication(),
  authorization(endPoint.profile),
  userService.profile
);
router.get(
  "/:userId/profile",
  validation(authValidation.shareProfile),
  userService.shareProfile
);
router.patch(
  "/update-profile",
  authentication(),
  validation(authValidation.updateBasicProfile),
  userService.updateBasicProfile
);
router.patch(
  "/image",
  authentication(),
  cloudFileUpload({
    fileValidation: fileValidators.image,
  }).single("image"),
  validation(authValidation.profileImage),
  userService.profileImage
);
router.patch(
  "/cover-image",
  authentication(),
  cloudFileUpload({
    fileValidation: fileValidators.image,
  }).array("images", 2),
  validation(authValidation.profileCoverImage),
  userService.profileCoverImage
);

//-----------------------------------------------NOTES--------------------------------------------------------------------------------
//.single("key") it means uplaod only one file at a time here takes one key "attachment" in req.file
//.array("key",limitNumber) for list of files and can limit the number of files here takes one key "attachment" in req.file
//.fields for multiple files , can named it to here each file will be name as "profileImage" and "coverImage" fields([
//   { name: "profileImage", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 },
// ])
//.any() it takes any number of files without certain name
//.none() it means no file will be uploaded
//-----------------------------------------------NOTES--------------------------------------------------------------------------------
router.delete(
  "{/:userId}/freeze",
  authentication(),
  validation(authValidation.freezeAccount),
  userService.freezeAccount
);
router.patch(
  "{/:userId}/restore",
  authentication(),
  validation(authValidation.restoreAccount),
  userService.restoreAccount
);
router.delete(
  "{/:userId}",
  authentication(),
  validation(authValidation.freezeAccount),
  userService.hardDeleteAccount
);
router.patch(
  "/update-password",
  authentication(),
  validation(authValidation.updatePassword),
  userService.updatePassword
);
router.get(
  "/refresh-token",
  authentication({ tokenType: tokenTypeEnum.refresh }),
  userService.getNewLoginCredentials
);
router.post("/logout", authentication(), userService.logout);
export default router;
