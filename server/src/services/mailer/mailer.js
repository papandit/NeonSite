// Nodemailer service. Sends via SMTP when configured; otherwise logs the email
// to the console (so local dev + the order flow still work without SMTP).
// Sends are best-effort: a mail failure never breaks the request that triggered it.

import nodemailer from 'nodemailer';
import { getIntegrations } from '../settings/integrations.js';
import User from '../../models/User.js';
import { orderConfirmation, statusUpdate } from './templates.js';

async function sendMail({ to, subject, html, text }) {
  if (!to) return;
  const smtp = (await getIntegrations()).smtp;
  if (!smtp.host || !smtp.user) {
    console.log(`📧  [mail:log] to=${to} subject="${subject}" (SMTP not configured — not sent)`);
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.sendMail({ from: smtp.from, to, subject, html, text });
    console.log(`📧  Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`📧  Failed to send "${subject}" to ${to}:`, err.message);
  }
}

async function resolveEmail(order) {
  if (order.user?.email) return order.user.email;
  const user = await User.findById(order.user).select('email').lean();
  return user?.email;
}

export async function sendOrderConfirmation(order) {
  const to = await resolveEmail(order);
  await sendMail({ to, ...orderConfirmation(order) });
}

export async function sendStatusUpdate(order, status, note) {
  const to = await resolveEmail(order);
  await sendMail({ to, ...statusUpdate(order, status, note) });
}

export default { sendOrderConfirmation, sendStatusUpdate };
