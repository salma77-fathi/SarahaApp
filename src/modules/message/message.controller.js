import { Router } from "express";
import * as messageService from "./message.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authentiaction.middleware.js";
import * as validators from "./message.validation.js";
import {
  cloudFileUpload,
  fileValidators,
} from "../../utils/multer/cloud.multer.js";
const router = Router();
router.post(
  "/:receiverId",
  authentication(),
  cloudFileUpload({ fileValidation: fileValidators.image }).array(
    "attachments",
    2
  ),
  validation(validators.sendMessage),
  messageService.sendMessage
);
router.post(
  "/:receiverId/sender",
  authentication(),
  cloudFileUpload({ validation: fileValidators.image }).array("attachments", 2),
  validation(validators.sendMessage),
  messageService.sendMessage
);
router.get("/:messageId", messageService.getMessageById);
router.delete(
  "/:messageId/soft",
  authentication(),
  messageService.softDeleteMessage
);
router.delete(
  "/:messageId/hard",
  authentication(),
  messageService.hardDeleteMessage
);

export default router;
