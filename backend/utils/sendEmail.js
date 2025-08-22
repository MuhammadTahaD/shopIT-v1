import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., smtp.mailtrap.io
    port: process.env.SMTP_PORT, // e.g., 2525
    auth: {
      user: process.env.SMTP_EMAIL,     // Mailtrap username
      pass: process.env.SMTP_PASSWORD,  // Mailtrap password
    },
  });

  const message = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // e.g., a password reset link
  };

  try {
    await transport.sendMail(message);
    console.log("✅ Email sent successfully.");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Email could not be sent.");
  }
};

export default sendEmail;
