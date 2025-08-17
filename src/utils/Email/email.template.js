export const emailTemplate = async ({
  data = {},
  title = "Confirm Code",
} = {}) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
    />
    <style>
      body {
        background-color: #ead6d2;
        margin: 0;
        font-family: Arial, sans-serif;
      }
      .email-container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border: 1px solid #a8656e;
        padding: 30px;
        border-radius: 8px;
      }
      .header {
        text-align: center;
        background-color: #a8656e;
        padding: 30px 0;
      }
      .header img {
        width: 50px;
        height: 50px;
      }
      .title {
        text-align: center;
        color: #a8656e;
        padding-top: 20px;
      }
      .content {
        text-align: center;
        color: #873442ff;
        padding: 20px 40px;
        font-size: 16px;
      }
      .verify-button {
        display: inline-block;
        margin-top: 25px;
        padding: 12px 24px;
        background-color: #a8656e;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #bfaeb3;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <img
          src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png"
          alt="icon"
          width="80"
          height="80"
          ;
        />
      </div>
      <h2 class="title">${title}</h2>
      <div class="content">
        <p>Hello there💖</p>
        <h3>Activation code ${data.otp} </h3>
        <p>
          You're almost set to start enjoying Saraha. Simply click the link
          below to verify your email address and get started.
        </p>
        <p><strong>The OTP expires in 2 minutes .</strong></p>
        <a href="" class="verify-button">Verify my email address</a>
      </div>
      <div class="footer">&copy; Saraha All rights reserved.</div>
    </div>
  </body>
</html>
`;
};
