import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.MAIL_HOST || process.env.EMAIL_HOST || 'mail.bcf.org.bd';
    const port = parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT || '465', 10);
    const user = process.env.MAIL_USERNAME || process.env.EMAIL_USER || '';
    const pass = process.env.MAIL_PASSWORD || process.env.EMAIL_PASS || '';
    const secure = process.env.MAIL_SECURE !== undefined
      ? process.env.MAIL_SECURE === 'true'
      : (process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === 'true' : port === 465);

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
 * Send official BCF registration confirmation email with attached application form PDF
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {Object} options.playerData - Player registration info
 * @param {Buffer} [options.pdfBuffer] - Attached PDF buffer
 */
export async function sendRegistrationWaitingEmail({ to, playerData, pdfBuffer }) {
  const mailer = getTransporter();
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER || process.env.MAIL_USERNAME || 'noreply@bcf.org.bd';
  const fromName = process.env.MAIL_FROM_NAME || 'Bangladesh Carrom Federation';
  const replyTo = process.env.MAIL_REPLY_TO || 'info@bcf.org.bd';

  const playerId = playerData.player_id || 'PENDING';
  const nameEn = playerData.name_en || 'Player';
  const nameBn = playerData.name_bn || nameEn;
  const nickname = playerData.nickname ? ` (${playerData.nickname})` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 0; }
        .wrapper { max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .badge { display: inline-block; background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-bottom: 20px; }
        .alert-box { background-color: #ECFDF5; border-left: 4px solid #047857; padding: 14px 18px; border-radius: 6px; margin: 20px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px; }
        .info-table td { padding: 10px 14px; border-bottom: 1px solid #F1F5F9; }
        .info-table tr:nth-child(even) { background-color: #F8FAFC; }
        .info-label { font-weight: 600; color: #475569; width: 40%; }
        .info-val { font-weight: 600; color: #0F172A; }
        .fee-card { background: #FFFBEB; border: 1px dashed #F59E0B; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
        .fee-title { font-weight: 700; color: #B45309; font-size: 14.5px; margin-bottom: 8px; }
        .fee-desc { font-size: 13px; color: #78350F; line-height: 1.6; margin: 0; }
        .footer { background-color: #F8FAFC; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>বাংলাদেশ ক্যারম ফেডারেশন</h1>
          <p>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত | জাতীয় ক্রীড়া পরিষদ</p>
        </div>
        
        <div class="content">
          <span class="badge">অনুমোদনের অপেক্ষায় (Waiting for Approval)</span>
          
          <h2 style="font-size: 18px; color: #0F172A; margin: 0 0 12px 0;">প্রিয় ${nameEn} ${nickname},</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            বাংলাদেশ ক্যারম ফেডারেশনের অফিসিয়াল প্লেয়ার পোর্টালে আপনার খেলোয়াড় নিবন্ধন আবেদনপত্র সফলভাবে গৃহীত হয়েছে। আপনার আবেদনটি বর্তমানে যাচাই ও পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।
          </p>
          
          <table class="info-table">
            <tr>
              <td class="info-label">খেলোয়াড় আইডি (Player ID):</td>
              <td class="info-val" style="color: #047857; font-size: 15px;">${playerId}</td>
            </tr>
            <tr>
              <td class="info-label">পূর্ণ নাম (বাংলা):</td>
              <td class="info-val">${nameBn}</td>
            </tr>
            <tr>
              <td class="info-label">ডাকনাম (Nickname):</td>
              <td class="info-val">${playerData.nickname || 'প্রযোজ্য নয়'}</td>
            </tr>
            <tr>
              <td class="info-label">পিতার নাম:</td>
              <td class="info-val">${playerData.father_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">মাতার নাম:</td>
              <td class="info-val">${playerData.mother_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">জাতীয় পরিচয়পত্র (NID):</td>
              <td class="info-val">${playerData.nid_number || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">জন্ম তারিখ:</td>
              <td class="info-val">${playerData.dob || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">মোবাইল ফোন নম্বর:</td>
              <td class="info-val">${playerData.phone || 'N/A'}</td>
            </tr>
          </table>

          <div class="fee-card">
            <div class="fee-title">অ্যাকাউন্ট অ্যাক্টিভেশন ফি ও পরবর্তী পদক্ষেপ:</div>
            <p class="fee-desc">
              ১. প্লেয়ার আইডি চূড়ান্ত সক্রিয়করণের জন্য <strong>৩০০/- (তিনশত) টাকা ফি</strong> প্রদান করতে হবে।<br/>
              ২. সংযুক্ত <strong>অফিসিয়াল আবেদন ফরমটি (PDF)</strong> প্রিন্ট করে মূল এনআইডি কার্ডসহ সরাসরি ফেডারেশনের অফিসে উপস্থিত হয়ে জমা দিন:<br/>
              <strong>মওলানা ভাসানী হকি স্টেডিয়াম, রুম নং ২৩৫, ২৬৬, ২৬৮, ২৬৯, ২৭০, ঢাকা-১০০০</strong>।<br/>
              ৩. অফিসিয়াল ভেরিফিকেশন সম্পন্ন হওয়ার পর আপনার প্রোফাইল জাতীয় ডিরেক্টরিতে সক্রিয় করা হবে।
            </p>
          </div>

          <p style="font-size: 13px; color: #64748B; margin: 20px 0 0 0;">
            * আপনার পূরণকৃত অফিসিয়াল আবেদন ফরমটি এই ইমেইলের সাথে PDF আকারে সংযুক্ত করা হয়েছে।
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0 0 4px 0;">বাংলাদেশ ক্যারম ফেডারেশন (BCF)</p>
          <p style="margin: 0;">রুম নং ২৩৫-২৭০, মওলানা ভাসানী হকি স্টেডিয়াম, ঢাকা-১০০০ | ফোন: +880 1712 096 895 | ইমেইল: info@bcf.org.bd</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `BCF_Player_Application_${playerId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  try {
    const info = await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      replyTo,
      to,
      subject: `বাংলাদেশ ক্যারম ফেডারেশন - খেলোয়াড় নিবন্ধন আবেদন গ্রহণ (Waiting for Approval) | ID: ${playerId}`,
      html: htmlContent,
      attachments
    });
    console.log(`[EMAIL SENT] Confirmation sent to ${to}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}
