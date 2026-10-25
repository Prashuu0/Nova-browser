const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (config.smtp?.host && config.smtp?.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port || 587,
      secure: false,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, from }) {
  const transport = getTransporter();
  const fromAddr = from || config.smtp?.from || 'nova@localhost';

  if (!transport) {
    console.log(`[Nova Mail] DEV → ${to}: ${subject}`);
    return { delivered: false, dev: true };
  }

  try {
    await transport.sendMail({ from: fromAddr, to, subject, text });
    return { delivered: true };
  } catch (err) {
    console.error('[Nova Mail] Send failed:', err.message);
    return { delivered: false, error: err.message };
  }
}

module.exports = { sendMail };
