import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.MAIL_HOST || process.env.EMAIL_HOST || '103.159.36.198';
    const port = parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT || '465', 10);
    const user = process.env.MAIL_USERNAME || process.env.EMAIL_USER || 'support@bcf.org.bd';
    const pass = process.env.MAIL_PASSWORD || process.env.EMAIL_PASS || '^PYu5c2jV02DG)gI';
    const secure =
      process.env.MAIL_SECURE !== undefined
        ? process.env.MAIL_SECURE === 'true'
        : process.env.EMAIL_SECURE !== undefined
        ? process.env.EMAIL_SECURE === 'true'
        : port === 465;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Send official BCF registration confirmation email in plain-text Bengali with attached application form PDF
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {Object} options.playerData - Player registration info
 * @param {Buffer} [options.pdfBuffer] - Attached PDF buffer
 */
export async function sendRegistrationWaitingEmail({ to, playerData, pdfBuffer }) {
  const mailer = getTransporter();
  const fromAddress =
    process.env.MAIL_FROM_ADDRESS ||
    process.env.EMAIL_USER ||
    process.env.MAIL_USERNAME ||
    'support@bcf.org.bd';
  const fromName = process.env.MAIL_FROM_NAME || 'বাংলাদেশ ক্যারম ফেডারেশন (BCF)';
  const replyTo = process.env.MAIL_REPLY_TO || 'support@bcf.org.bd';

  const playerId = playerData.player_id || 'PENDING';
  const nameBn = playerData.name_bn || playerData.name_en || 'খেলোয়াড়';
  const nameEn = playerData.name_en || '';
  const nickname = playerData.nickname ? ` (${playerData.nickname})` : '';

  const plainTextContent = [
    `প্রিয় ${nameBn}${nickname},`,
    ``,
    `বাংলাদেশ ক্যারম ফেডারেশন (BCF)-এর জাতীয় খেলোয়াড় নিবন্ধন পোর্টালে আপনার আবেদনটি সফলভাবে গৃহীত হয়েছে।`,
    ``,
    `আবেদনের বর্তমান অবস্থা (Status): অনুমোদনের অপেক্ষায় (Pending Federation Approval)`,
    ``,
    `নিবন্ধিত খেলোয়াড়ের বিবরণ:`,
    `- প্লেয়ার আইডি (Player ID): ${playerId}`,
    `- পূর্ণ নাম (বাংলা): ${nameBn}`,
    `- পূর্ণ নাম (ইংরেজি): ${nameEn || 'N/A'}`,
    `- পিতার নাম: ${playerData.father_name || 'N/A'}`,
    `- মাতার নাম: ${playerData.mother_name || 'N/A'}`,
    `- জন্ম তারিখ: ${playerData.dob || 'N/A'}`,
    `- জাতীয় পরিচয়পত্র নম্বর (NID): ${playerData.nid_number || 'N/A'}`,
    `- মোবাইল নম্বর: ${playerData.phone || 'N/A'}`,
    ``,
    `পরবর্তী করণীয় ও নির্দেশনা (Next Instructions):`,
    `১. আপনার প্লেয়ার অ্যাকাউন্ট ও নিবন্ধন চূড়ান্তভাবে সক্রিয় (Activate) করার জন্য ৩০০/- (তিনশত) টাকা নিবন্ধন ফি জমা দিতে হবে।`,
    `২. এই ইমেইলের সাথে সংযুক্ত অফিসিয়াল আবেদন ফরমটি (PDF) ডাউনলোড ও প্রিন্ট করে আপনার মূল জাতীয় পরিচয়পত্র (NID) কার্ডসহ সরাসরি ফেডারেশনের কার্যালয়ে উপস্থিত হয়ে জমা দিন:`,
    `   ঠিকানা: মওলানা ভাসানী হকি স্টেডিয়াম, রুম নং ২৩৫, ২৬৬, ২৬৮, ২৬৯, ২৭০, ঢাকা-১০০০।`,
    `   যোগাযোগ: +880 1712 096 895`,
    `৩. অফিসে মূল কাগজপত্র যাচাই এবং নির্ধারিত ফি জমা দেওয়ার পর ফেডারেশন কর্তৃপক্ষ আপনার নিবন্ধন চূড়ান্তভাবে অনুমোদন (Approve) করবে।`,
    ``,
    `বি.দ্র.: আপনার পূরণকৃত অফিসিয়াল আবেদন ফরমটি (BCF_Application_Form_${playerId}.pdf) এই ইমেইলের সাথে সংযুক্ত (Attachment) করা হয়েছে।`,
    ``,
    `ধন্যবাদান্তে,`,
    `বাংলাদেশ ক্যারম ফেডারেশন (BCF)`,
    `মওলানা ভাসানী হকি স্টেডিয়াম, ঢাকা-১০০০`,
    `ইমেইল: support@bcf.org.bd | ওয়েবসাইট: https://bcf.org.bd`
  ].join('\n');

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `BCF_Application_Form_${playerId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  try {
    const info = await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      replyTo,
      to,
      subject: `বাংলাদেশ ক্যারম ফেডারেশন - খেলোয়াড় নিবন্ধন আবেদন গৃহীত (ID: ${playerId})`,
      text: plainTextContent,
      attachments
    });
    console.log(`[EMAIL SENT] Plain-text Bengali confirmation sent to ${to}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}
