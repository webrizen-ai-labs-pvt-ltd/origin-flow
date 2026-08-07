import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env["MAIL_HOST"] || "smtp.gmail.com",
  port: parseInt(process.env["MAIL_PORT"] || "465"),
  secure: true,
  auth: {
    user: process.env["MAIL_USER"],
    pass: process.env["MAIL_PASS"],
  },
});

export const sendWelcomeEmail = async (to: string, name: string) => {
  try {
    await transporter.sendMail({
      from: `"Webrizen" <${process.env["MAIL_USER"]}>`,
      to,
      subject: "Welcome to Origin Flow!",
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>We are thrilled to have you on board. Your account has been created successfully.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
      `,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${to}:`, error);
  }
};
