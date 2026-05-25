const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = { sendMail: async (opts) => logger.info(`sendMail (dev): ${JSON.stringify(opts)}`) };
  }
  return transporter;
}

async function sendMail({ to, subject, text, html, from }) {
  const t = getTransporter();
  try {
    return await t.sendMail({ from: from || process.env.MAIL_FROM || 'no-reply@localhost', to, subject, text, html });
  } catch (e) {
    logger.error(`Email send failed: ${e.message}`);
    throw e;
  }
}

module.exports = { sendMail };
