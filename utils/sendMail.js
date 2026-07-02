const nodemailer = require("nodemailer");

const sendMail = async (
  from,
  to,
  subject,
  html,
  attachments = []
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    replyTo: from,
    to,
    subject,
    html,
    attachments,
  });
};

module.exports = sendMail;