import 'regenerator-runtime/runtime.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '../assets');
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

/**
 * Generate official BCF Player Registration Application Form PDF
 * - Pure White Background (No cream/yellow tint)
 * - 100% Vector Code-Generated Crystal Clear Letterhead
 * - Full English Typography with Zero Font Glitches or Missing Boxes
 * @param {Object} playerData - Player registration information
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateApplicationPdf(playerData) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Load Standard Crisp English Fonts
  const enFontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const enFont = await doc.embedFont(StandardFonts.Helvetica);

  // Load Bengali Font safely ONLY for Bengali text fields (name_bn, father, mother if non-ASCII)
  let bnFont = null;
  const bnFontPaths = [
    path.join(ASSETS_DIR, 'NotoSansBengali.ttf'),
    path.join(ASSETS_DIR, 'NotoSerifBengali-Regular.ttf')
  ];
  for (const fPath of bnFontPaths) {
    if (fs.existsSync(fPath)) {
      try {
        const fontBytes = fs.readFileSync(fPath);
        bnFont = await doc.embedFont(fontBytes);
        break;
      } catch (e) {
        // Fallback
      }
    }
  }

  // A4 Page Dimensions: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // 1. PURE WHITE BACKGROUND ACROSS ENTIRE PAGE
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(1, 1, 1)
  });

  // 2. CODE-GENERATED CRYSTAL CLEAR VECTOR LETTERHEAD
  // Top Left: High-Resolution BCF Logo
  const logoPath = path.join(ASSETS_DIR, 'bcf-logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      page.drawImage(logoImg, {
        x: 45,
        y: 755,
        width: 44,
        height: 55
      });
    } catch (e) {
      console.error('[PDF LOGO EMBED ERROR]:', e.message);
    }
  }

  // Header Title beside Logo
  page.drawText('BANGLADESH', {
    x: 98,
    y: 792,
    size: 15,
    font: enFontBold,
    color: rgb(0.08, 0.12, 0.18)
  });
  page.drawText('CARROM FEDERATION', {
    x: 98,
    y: 775,
    size: 15,
    font: enFontBold,
    color: rgb(0.08, 0.12, 0.18)
  });
  page.drawText('Affiliated with National Sports Council (NSC), ACF & ICF', {
    x: 98,
    y: 762,
    size: 8,
    font: enFontBold,
    color: rgb(0.02, 0.45, 0.28)
  });

  // Top Right: Secretariat Contact Block
  const contactLines = [
    'Room No: 235, 266, 268, 269, 270',
    'Moulana Bhashani Hockey Stadium, Dhaka-1000',
    'Phone: +880 1712 096 895',
    'Email: info@bcf.org.bd  |  Web: www.bcf.org.bd'
  ];
  let contactY = 794;
  for (const line of contactLines) {
    page.drawText(line, {
      x: 350,
      y: contactY,
      size: 7.5,
      font: enFont,
      color: rgb(0.32, 0.36, 0.42)
    });
    contactY -= 11.5;
  }

  // Crisp Vector Divider Line
  page.drawLine({
    start: { x: 45, y: 742 },
    end: { x: 550, y: 742 },
    thickness: 0.8,
    color: rgb(0.8, 0.83, 0.86),
    dashArray: [4, 3]
  });

  // 3. FORM TITLE & SUBTITLE
  page.drawText('NATIONAL PLAYER REGISTRATION APPLICATION FORM', {
    x: 45,
    y: 716,
    size: 13,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });
  page.drawText('Official Federation Athlete Dossier & Verification Application', {
    x: 45,
    y: 702,
    size: 8.5,
    font: enFont,
    color: rgb(0.38, 0.42, 0.48)
  });

  // 4. APPLICATION REFERENCE & STATUS BANNER
  page.drawRectangle({
    x: 45,
    y: 668,
    width: 505,
    height: 24,
    color: rgb(0.97, 0.99, 0.98),
    borderColor: rgb(0.04, 0.55, 0.35),
    borderWidth: 0.8
  });

  page.drawText(`APPLICATION REF / BCF ID: ${playerData.player_id || 'PENDING'}`, {
    x: 55,
    y: 676,
    size: 9.5,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });

  page.drawText('STATUS: PENDING FEDERATION APPROVAL', {
    x: 360,
    y: 676,
    size: 8,
    font: enFontBold,
    color: rgb(0.75, 0.4, 0.05)
  });

  // 5. PLAYER PASSPORT PHOTO (Top Right)
  const photoX = 450;
  const photoY = 536;
  const photoW = 100;
  const photoH = 120;

  let embeddedPhoto = false;
  if (playerData.photo_url) {
    try {
      let photoBuffer = null;
      if (playerData.photo_url.startsWith('data:image')) {
        const base64Data = playerData.photo_url.split(';base64,').pop();
        photoBuffer = Buffer.from(base64Data, 'base64');
      } else if (playerData.photo_url.startsWith('/uploads/')) {
        const localPath = path.join(UPLOADS_ROOT, playerData.photo_url.replace('/uploads/', ''));
        if (fs.existsSync(localPath)) photoBuffer = fs.readFileSync(localPath);
      } else if (playerData.photo_url.startsWith('http')) {
        const filename = path.basename(playerData.photo_url);
        const localPath = path.join(UPLOADS_ROOT, 'players/photos', filename);
        if (fs.existsSync(localPath)) {
          photoBuffer = fs.readFileSync(localPath);
        } else {
          try {
            const resp = await fetch(playerData.photo_url, { signal: AbortSignal.timeout(6000) });
            if (resp.ok) {
              photoBuffer = Buffer.from(await resp.arrayBuffer());
            }
          } catch (netErr) {
            console.error('[PDF PHOTO REMOTE FETCH ERROR]:', netErr.message);
          }
        }
      }

      if (photoBuffer) {
        const jpegBuffer = await sharp(photoBuffer)
          .resize(300, 360, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toBuffer();

        const photoImg = await doc.embedJpg(jpegBuffer);
        page.drawImage(photoImg, {
          x: photoX,
          y: photoY,
          width: photoW,
          height: photoH
        });
        embeddedPhoto = true;
      }
    } catch (e) {
      console.error('[PDF EMBED PHOTO ERROR]:', e.message);
    }
  }

  // Draw Photo Frame
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoW,
    height: photoH,
    borderColor: rgb(0.75, 0.8, 0.85),
    borderWidth: 1,
    color: embeddedPhoto ? undefined : rgb(0.97, 0.98, 0.99)
  });

  if (!embeddedPhoto) {
    page.drawText('PLAYER PHOTO', {
      x: photoX + 18,
      y: photoY + 64,
      size: 8,
      font: enFontBold,
      color: rgb(0.45, 0.5, 0.55)
    });
    page.drawText('(Passport Size)', {
      x: photoX + 22,
      y: photoY + 50,
      size: 7,
      font: enFont,
      color: rgb(0.55, 0.6, 0.65)
    });
  }

  // Helper function to safely render text (Helvetica for Latin, bnFont only for Bengali)
  const drawSafeText = (text, x, y, size = 8.5, isBold = false, color = rgb(0.1, 0.12, 0.15)) => {
    if (!text) return;
    const str = String(text);
    const hasBengali = /[\u0980-\u09FF]/.test(str);

    if (hasBengali && bnFont) {
      try {
        page.drawText(str, {
          x,
          y,
          size: size * 0.95,
          font: bnFont,
          color
        });
        return;
      } catch (e) {
        // fallback to sanitized ascii
      }
    }

    // Default: Crisp Vector Helvetica
    const sanitized = str.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ');
    page.drawText(sanitized, {
      x,
      y,
      size,
      font: isBold ? enFontBold : enFont,
      color
    });
  };

  // Helper to draw clean data row
  const drawRow = (label, val, x, y, labelWidth = 140, isShaded = false) => {
    if (isShaded) {
      page.drawRectangle({
        x: x - 4,
        y: y - 4,
        width: 395,
        height: 18,
        color: rgb(0.98, 0.99, 0.99)
      });
    }

    drawSafeText(label, x, y, 8, true, rgb(0.25, 0.3, 0.35));
    drawSafeText(val || 'N/A', x + labelWidth, y, 8.5, false, rgb(0.08, 0.1, 0.12));
  };

  // Helper to draw full-width data row
  const drawFullRow = (label, val, x, y, labelWidth = 160, isShaded = false) => {
    if (isShaded) {
      page.drawRectangle({
        x: x - 4,
        y: y - 4,
        width: 505,
        height: 18,
        color: rgb(0.98, 0.99, 0.99)
      });
    }

    drawSafeText(label, x, y, 8, true, rgb(0.25, 0.3, 0.35));
    drawSafeText(val || 'N/A', x + labelWidth, y, 8.5, false, rgb(0.08, 0.1, 0.12));
  };

  let currentY = 642;

  // SECTION 1: PERSONAL PARTICULARS
  page.drawText('1. PERSONAL PARTICULARS', {
    x: 45,
    y: currentY,
    size: 9.5,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });
  page.drawLine({
    start: { x: 45, y: currentY - 4 },
    end: { x: 390, y: currentY - 4 },
    thickness: 0.8,
    color: rgb(0.02, 0.42, 0.26)
  });
  currentY -= 18;

  drawRow('Full Name (English):', playerData.name_en, 45, currentY, 140, true);
  currentY -= 17;
  drawRow('Bengali Name:', playerData.name_bn || playerData.name_en, 45, currentY, 140, false);
  currentY -= 17;
  drawRow('Nickname / Alias:', playerData.nickname || 'N/A', 45, currentY, 140, true);
  currentY -= 17;
  drawRow("Father's Name:", playerData.father_name, 45, currentY, 140, false);
  currentY -= 17;
  drawRow("Mother's Name:", playerData.mother_name, 45, currentY, 140, true);
  currentY -= 17;
  drawRow('Date of Birth (DOB):', playerData.dob, 45, currentY, 140, false);
  currentY -= 17;
  drawRow('National ID (NID) Number:', playerData.nid_number, 45, currentY, 140, true);
  currentY -= 17;
  const genderDisplay = playerData.gender === 'Women' ? 'Women / Female' : (playerData.gender === 'Other' ? 'Other' : 'Men / Male');
  drawRow('Gender / Division:', genderDisplay, 45, currentY, 140, false);

  currentY -= 20;

  // SECTION 2: FEDERATION PROFILE & CONTACT INFORMATION
  page.drawText('2. FEDERATION PROFILE & CONTACT DETAILS', {
    x: 45,
    y: currentY,
    size: 9.5,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });
  page.drawLine({
    start: { x: 45, y: currentY - 4 },
    end: { x: 550, y: currentY - 4 },
    thickness: 0.8,
    color: rgb(0.02, 0.42, 0.26)
  });
  currentY -= 18;

  const playerSinceText = `${playerData.player_since || new Date().getFullYear()} ${playerData.is_new_player ? '(New Registered Player)' : ''}`;
  drawFullRow('Active Player Since (Year):', playerSinceText, 45, currentY, 160, true);
  currentY -= 17;
  drawFullRow('Membership:', `Waiting for Official Approval`, 45, currentY, 160, false);
  currentY -= 17;
  drawFullRow('Mobile Contact Number:', playerData.phone, 45, currentY, 160, true);
  currentY -= 17;
  drawFullRow('Registered Email Address:', playerData.email, 45, currentY, 160, false);

  currentY -= 22;

  // SECTION 3: RESIDENTIAL ADDRESS
  page.drawText('3. RESIDENTIAL & PERMANENT ADDRESS', {
    x: 45,
    y: currentY,
    size: 9.5,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });
  page.drawLine({
    start: { x: 45, y: currentY - 4 },
    end: { x: 550, y: currentY - 4 },
    thickness: 0.8,
    color: rgb(0.02, 0.42, 0.26)
  });
  currentY -= 18;

  const presentAddress = `${playerData.present_street || 'N/A'}, District: ${playerData.district || 'Dhaka'}${playerData.present_zip ? ` (Zip: ${playerData.present_zip})` : ''}`;
  drawFullRow('Present Residential Address:', presentAddress, 45, currentY, 160, true);
  currentY -= 17;

  const permanentAddress = playerData.same_as_present
    ? 'Same as Present Residential Address'
    : `${playerData.permanent_street || 'Same as Present Address'}${playerData.permanent_zip ? ` (Zip: ${playerData.permanent_zip})` : ''}`;
  drawFullRow('Permanent Address:', permanentAddress, 45, currentY, 160, false);

  currentY -= 24;

  // SECTION 4: MANDATORY ACCOUNT ACTIVATION TERMS & GUIDELINES
  const termsBoxH = 80;
  page.drawRectangle({
    x: 45,
    y: currentY - termsBoxH + 12,
    width: 505,
    height: termsBoxH,
    color: rgb(0.98, 0.99, 0.98),
    borderColor: rgb(0.04, 0.55, 0.35),
    borderWidth: 0.8
  });

  page.drawText('MANDATORY ACCOUNT ACTIVATION TERMS & FEE GUIDELINES:', {
    x: 55,
    y: currentY - 1,
    size: 8.5,
    font: enFontBold,
    color: rgb(0.02, 0.42, 0.26)
  });

  const termsList = [
    '1. Account Activation Fee: A mandatory registration fee of BDT 300/- (Three Hundred Taka) must be deposited.',
    '2. Physical Submission: Please submit this printed application form along with your original National ID (NID) at:',
    '    Room No: 235, 266, 268, 269, 270, Moulana Bhashani Hockey Stadium, Dhaka-1000 (Phone: +880 1712 096 895).',
    '3. License Activation: Upon original document verification and fee payment, official membership approval will be granted.'
  ];

  let termY = currentY - 14;
  for (const term of termsList) {
    page.drawText(term, {
      x: 55,
      y: termY,
      size: 7.5,
      font: enFont,
      color: rgb(0.15, 0.2, 0.25)
    });
    termY -= 12.5;
  }

  // SECTION 5: SIGNATURES & VERIFICATION (Bottom)
  const sigLineY = 95;

  // Applicant Signature Block (Left)
  page.drawLine({
    start: { x: 65, y: sigLineY },
    end: { x: 225, y: sigLineY },
    thickness: 0.8,
    color: rgb(0.5, 0.55, 0.6)
  });
  page.drawText("Applicant's Signature & Date", {
    x: 85,
    y: sigLineY - 12,
    size: 8,
    font: enFontBold,
    color: rgb(0.25, 0.3, 0.35)
  });

  // Federation Authority Block (Right)
  page.drawLine({
    start: { x: 370, y: sigLineY },
    end: { x: 530, y: sigLineY },
    thickness: 0.8,
    color: rgb(0.5, 0.55, 0.6)
  });
  page.drawText('General Secretary / Authorized Official', {
    x: 378,
    y: sigLineY - 12,
    size: 8,
    font: enFontBold,
    color: rgb(0.25, 0.3, 0.35)
  });
  page.drawText('Bangladesh Carrom Federation (BCF)', {
    x: 395,
    y: sigLineY - 22,
    size: 7.5,
    font: enFont,
    color: rgb(0.4, 0.45, 0.5)
  });

  // Bottom Footer
  page.drawLine({
    start: { x: 45, y: 48 },
    end: { x: 550, y: 48 },
    thickness: 0.5,
    color: rgb(0.85, 0.88, 0.9)
  });

  page.drawText(`BCF Official National Athlete Application  •  Player ID: ${playerData.player_id || 'PENDING'}`, {
    x: 45,
    y: 36,
    size: 6.5,
    font: enFont,
    color: rgb(0.55, 0.6, 0.65)
  });

  page.drawText('Official Portal: https://bcf.org.bd  •  Page 1 of 1', {
    x: 410,
    y: 36,
    size: 6.5,
    font: enFont,
    color: rgb(0.55, 0.6, 0.65)
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
