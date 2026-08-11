import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getLogoPath = (): string | null => {
  const possiblePaths = [
    path.resolve(__dirname, "../../../../packages/assets/logo.png"),
    path.resolve(process.cwd(), "packages/assets/logo.png"),
    path.resolve(process.cwd(), "../../packages/assets/logo.png"),
    path.resolve(process.cwd(), "../packages/assets/logo.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
};

const getTransporter = () => {
  const host = process.env["MAIL_HOST"] || "smtp.hostinger.com";
  const port = parseInt(process.env["MAIL_PORT"] || "465", 10);
  const user = process.env["MAIL_USER"];
  const pass = process.env["MAIL_PASS"];

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const getLogoHtml = (logoPath: string | null) => {
  return logoPath
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td valign="middle" style="padding-right: 12px;">
            <img src="cid:originflow-logo" alt="Origin Flow" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 8px; object-fit: contain;" />
          </td>
          <td valign="middle">
            <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">Origin Flow</span>
          </td>
        </tr>
      </table>`
    : `<div style="font-size: 20px; font-weight: 700; color: #4f46e5; margin-bottom: 24px;">⚡ Origin Flow</div>`;
};

const formatINR = (paise: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  try {
    const fromUser = process.env["MAIL_USER"] || "hello@webrizen.com";
    const transporter = getTransporter();
    const logoPath = getLogoPath();

    const attachments = logoPath
      ? [
          {
            filename: "logo.png",
            path: logoPath,
            cid: "originflow-logo",
          },
        ]
      : [];

    const logoHtml = getLogoHtml(logoPath);

    const info = await transporter.sendMail({
      from: `"Origin Flow" <${fromUser}>`,
      to,
      subject: "Welcome to Origin Flow!",
      text: `Hello ${name},\n\nWelcome to Origin Flow! Your account has been created successfully.\n\nYou can now sign in to your dashboard at http://localhost:3001/sign-in\n\nBest regards,\nThe Origin Flow Team`,
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Origin Flow</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #111827; }
            .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px; }
            p { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
            .card { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
            .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-top: 8px; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${logoHtml}
            <h1>Welcome, ${name}!</h1>
            <p>We're thrilled to welcome you to Origin Flow. Your account has been created and is ready to use.</p>
            <div class="card">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e293b; font-size: 14px;">Your Account Details:</p>
              <p style="margin: 0; color: #475569; font-size: 14px;">Email: <strong>${to}</strong></p>
            </div>
            <p>You can sign in securely using Google authentication or your registered Passkeys.</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 20px;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                  <a href="http://localhost:3001/sign-in" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 8px;">Sign In to Dashboard &rarr;</a>
                </td>
              </tr>
            </table>
            <div class="footer">
              <p style="margin: 0;">If you have any questions, simply reply to this email.</p>
              <p style="margin: 6px 0 0;">&copy; ${new Date().getFullYear()} Origin Flow / Webrizen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Welcome email successfully sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${to}:`, error);
    return false;
  }
};

export const sendPaymentSuccessEmail = async ({
  to,
  name,
  planName,
  amountInPaise,
  billingCycle,
  validUntil,
  transactionId,
}: {
  to: string;
  name: string;
  planName: string;
  amountInPaise: number;
  billingCycle: string;
  validUntil: Date;
  transactionId: string;
}) => {
  try {
    const fromUser = process.env["MAIL_USER"] || "hello@webrizen.com";
    const transporter = getTransporter();
    const logoPath = getLogoPath();

    const attachments = logoPath
      ? [
          {
            filename: "logo.png",
            path: logoPath,
            cid: "originflow-logo",
          },
        ]
      : [];

    const logoHtml = getLogoHtml(logoPath);
    const formattedAmount = formatINR(amountInPaise);
    const formattedDate = validUntil.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const info = await transporter.sendMail({
      from: `"Origin Flow Billing" <${fromUser}>`,
      to,
      subject: `Payment Successful: ${planName} Plan Activated!`,
      text: `Hello ${name},\n\nYour payment of ${formattedAmount} for the ${planName} (${billingCycle}) plan has been processed successfully via PhonePe.\n\nTransaction ID: ${transactionId}\nPlan Validity: Until ${formattedDate}\n\nThank you for choosing Origin Flow!\n\nBest regards,\nThe Origin Flow Team`,
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #111827; }
            .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px; }
            p { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
            .receipt-box { background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bbf7d0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
            .receipt-row:last-child { border-bottom: none; }
            .badge { display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${logoHtml}
            <div style="margin-bottom: 12px;"><span class="badge">Payment Confirmed</span></div>
            <h1>Thank You for Subscribing!</h1>
            <p>Hello <strong>${name}</strong>, your payment via PhonePe has been confirmed and your organization account is now active with the <strong>${planName}</strong> plan.</p>
            
            <div class="receipt-box">
              <table style="width: 100%; font-size: 14px; color: #1e293b;" cellpadding="6" cellspacing="0">
                <tr>
                  <td style="color: #64748b;">Plan:</td>
                  <td style="text-align: right; font-weight: 600;">${planName} (${billingCycle})</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Amount Paid:</td>
                  <td style="text-align: right; font-weight: 700; color: #15803d; font-size: 16px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Transaction ID:</td>
                  <td style="text-align: right; font-mono; font-size: 12px;">${transactionId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Valid Until:</td>
                  <td style="text-align: right; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Payment Gateway:</td>
                  <td style="text-align: right; font-weight: 600;">PhonePe PG (UPI/Cards)</td>
                </tr>
              </table>
            </div>

            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 20px;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                  <a href="http://localhost:3001/dashboard/plans" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 8px;">View Subscription &rarr;</a>
                </td>
              </tr>
            </table>

            <div class="footer">
              <p style="margin: 0;">This email serves as an official payment receipt.</p>
              <p style="margin: 6px 0 0;">&copy; ${new Date().getFullYear()} Origin Flow / Webrizen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Payment success email sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send payment success email to ${to}:`, error);
    return false;
  }
};

export const sendPaymentFailedEmail = async ({
  to,
  name,
  planName,
  amountInPaise,
  transactionId,
  reason,
}: {
  to: string;
  name: string;
  planName: string;
  amountInPaise: number;
  transactionId: string;
  reason?: string;
}) => {
  try {
    const fromUser = process.env["MAIL_USER"] || "hello@webrizen.com";
    const transporter = getTransporter();
    const logoPath = getLogoPath();

    const attachments = logoPath
      ? [
          {
            filename: "logo.png",
            path: logoPath,
            cid: "originflow-logo",
          },
        ]
      : [];

    const logoHtml = getLogoHtml(logoPath);
    const formattedAmount = formatINR(amountInPaise);

    const info = await transporter.sendMail({
      from: `"Origin Flow Billing" <${fromUser}>`,
      to,
      subject: `Payment Incomplete for ${planName} Plan`,
      text: `Hello ${name},\n\nWe were unable to process your payment of ${formattedAmount} for the ${planName} plan via PhonePe.\n\nTransaction ID: ${transactionId}\nReason: ${reason || "Transaction was not completed"}\n\nYou can retry your payment at http://localhost:3001/dashboard/plans\n\nBest regards,\nThe Origin Flow Team`,
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Notification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #111827; }
            .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px; }
            p { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
            .error-box { background-color: #fef2f2; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #fecaca; }
            .badge { display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${logoHtml}
            <div style="margin-bottom: 12px;"><span class="badge">Payment Unsuccessful</span></div>
            <h1>Payment Incomplete</h1>
            <p>Hello <strong>${name}</strong>, your recent payment attempt of <strong>${formattedAmount}</strong> for the <strong>${planName}</strong> plan could not be completed.</p>
            
            <div class="error-box">
              <p style="margin: 0 0 6px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Transaction Reference: ${transactionId}</p>
              <p style="margin: 0; font-size: 13px; color: #7f1d1d;">Status Detail: ${reason || "Payment was cancelled or rejected by issuing bank/UPI app."}</p>
            </div>

            <p>No money was charged. If your account was debited, your bank will automatically refund it within 3-5 business days.</p>

            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 20px;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                  <a href="http://localhost:3001/dashboard/plans" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 8px;">Retry Payment &rarr;</a>
                </td>
              </tr>
            </table>

            <div class="footer">
              <p style="margin: 0;">If you need assistance, please reply to this email.</p>
              <p style="margin: 6px 0 0;">&copy; ${new Date().getFullYear()} Origin Flow / Webrizen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Payment failed email sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send payment failed email to ${to}:`, error);
    return false;
  }
};

export const sendPlanAssignedEmail = async ({
  to,
  name,
  planName,
  billingCycle,
  validUntil,
  notes,
}: {
  to: string;
  name: string;
  planName: string;
  billingCycle: string;
  validUntil: Date;
  notes?: string | null;
}) => {
  try {
    const fromUser = process.env["MAIL_USER"] || "hello@webrizen.com";
    const transporter = getTransporter();
    const logoPath = getLogoPath();

    const attachments = logoPath
      ? [
          {
            filename: "logo.png",
            path: logoPath,
            cid: "originflow-logo",
          },
        ]
      : [];

    const logoHtml = getLogoHtml(logoPath);
    const formattedDate = validUntil.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const info = await transporter.sendMail({
      from: `"Origin Flow Admin" <${fromUser}>`,
      to,
      subject: `Subscription Access Granted: ${planName} Plan`,
      text: `Hello ${name},\n\nAn administrator has granted your organization access to the ${planName} (${billingCycle}) plan.\n\nPlan Validity: Until ${formattedDate}\n${notes ? `Note: ${notes}\n` : ""}\nYou can now access all features included in this tier.\n\nBest regards,\nThe Origin Flow Team`,
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Plan Access Granted</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #111827; }
            .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px; }
            p { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
            .info-box { background-color: #f0f9ff; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd; }
            .badge { display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            ${logoHtml}
            <div style="margin-bottom: 12px;"><span class="badge">Plan Assigned</span></div>
            <h1>Subscription Activated</h1>
            <p>Hello <strong>${name}</strong>, an administrator has assigned the <strong>${planName}</strong> plan to your organization.</p>
            
            <div class="info-box">
              <p style="margin: 0 0 6px 0; font-size: 14px; color: #0369a1; font-weight: 600;">Plan: ${planName} (${billingCycle})</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #075985;">Valid Until: <strong>${formattedDate}</strong></p>
              ${notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #075985; border-top: 1px dashed #7dd3fc; padding-top: 8px;"><em>Admin Note: ${notes}</em></p>` : ""}
            </div>

            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 20px;">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                  <a href="http://localhost:3001/dashboard" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 8px;">Go to Dashboard &rarr;</a>
                </td>
              </tr>
            </table>

            <div class="footer">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Origin Flow / Webrizen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Plan assigned email sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send plan assigned email to ${to}:`, error);
    return false;
  }
};
