import { Router } from "express";
import * as authService from "./auth.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as authValidation from "./auth.validation.js";
const router = Router();
router.post("/signup", validation(authValidation.signup), authService.signup);
router.post("/login", validation(authValidation.login), authService.login);
router.patch(
  "/confirm-email",
  validation(authValidation.confirmEmail),
  authService.confirmEmail
);
router.post(
  "/signup-gmail",
  validation(authValidation.signupWithGmail),
  authService.signupWithGmail
);
router.post(
  "/login-gmail",
  validation(authValidation.signupWithGmail),
  authService.loginWithGmail
);
router.post("/send-ConfirmationCode", authService.sendEmailConfirmationCode);
router.post("/refresh", authService.refreshTokenController);
router.patch(
  "/send-forgot-password",
  validation(authValidation.sendForgotPassword),
  authService.sendForgotPassword
);
router.patch(
  "/verify-forgot-code",
  validation(authValidation.verifyForgotCode),
  authService.verifyForgotCode
);
router.patch(
  "/reset-forgot-password",
  validation(authValidation.resetForgotPassword),
  authService.resetForgotPassword
);
// router.delete("/test-delete-expired-tokens", authService.testCronJob);
export default router;
