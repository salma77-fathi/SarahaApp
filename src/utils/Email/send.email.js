import nodemailer from "nodemailer";

//console.log(path.resolve('./index.txt'));
export async function sendEmail({
  from = process.env.APP_EMAIL,
  to = [],
  cc = [],
  bcc = [],
  subject = "Hello ✔",
  text = "",
  html = "",
  attachments = [],
} = {}) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // true for 465, false for other ports
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });
  (async () => {
    const info = await transporter.sendMail({
      from: `"saraha💖" <${from}>`,
      to,
      subject,
      text, // plain‑text body
      html, // HTML body
      attachments,
    });

    console.log("Message sent:", info.messageId);
  })();
}
