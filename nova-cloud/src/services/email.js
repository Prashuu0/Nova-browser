const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.host || !config.smtp.user) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Nova Cloud Email] DEV MODE — To: ${to}\nSubject: ${subject}\n${text || html}`);
    return { dev: true };
  }
  return transport.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, '')
  });
}

async function sendVerificationEmail(email, token) {
  const link = `${config.appUrl}/verify?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify your Nova Account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#6366f1">Welcome to Nova</h2>
        <p>Click below to verify your email and activate your Nova Cloud account.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px">Verify Email</a>
        <p style="color:#888;font-size:12px;margin-top:24px">Link expires in 24 hours.</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail(email, token) {
  const link = `${config.appUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your Nova password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#6366f1">Password Reset</h2>
        <p>Click below to reset your Nova account password.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a>
        <p style="color:#888;font-size:12px;margin-top:24px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
