import EventEmitter from "node:events";
import { sendEmail } from "../Email/send.email.js";
import { emailTemplate } from "../Email/email.template.js";
export const emailEvent = new EventEmitter();
emailEvent.on(
  "confirmEmail",
  async ({ email, subject = "Confirm-email", otp } = {}) => {
    const html = await emailTemplate({ data: { otp } });
    await sendEmail({
      to: email,
      subject,
      html,
    });
  }
);

emailEvent.on(
  "forgotPassword",
  async ({ email, subject = "forgot-password", otp } = {}) => {
    const html = await emailTemplate({ data: { otp }, title: "reset code" });
    await sendEmail({
      to: email,
      subject,
      html,
    });
  }
);
