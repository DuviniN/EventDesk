const nodemailer = require("nodemailer");

// Lightweight mail helper that supports text, html, and attachments while keeping
// backward compatibility with the old (to, subject, text) signature.
const sendEmail = async (to, subject, content, extra = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use app password (NOT real password)
    },
  });

  const payload = typeof content === 'string'
    ? { text: content }
    : { text: content?.text, html: content?.html, attachments: content?.attachments };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    ...payload,
    ...extra
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;