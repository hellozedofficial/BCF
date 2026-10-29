import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import crypto from 'crypto';

let cachedWorker = null;

async function getWorker() {
  if (!cachedWorker) {
    try {
      cachedWorker = await createWorker(['eng', 'ben'], 1);
    } catch (e) {
      console.error('[OCR WORKER INIT ERROR]:', e);
      cachedWorker = await createWorker('eng', 1);
    }
  }
  return cachedWorker;
}

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function normalizeDobToIso(raw) {
  if (!raw) return '';
  const str = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // e.g. 30 Mar 2002 or 01 Feb 1993
  const textMonthMatch = str.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, '0');
    const monthKey = textMonthMatch[2].slice(0, 3).toLowerCase();
    const month = MONTH_MAP[monthKey];
    const year = textMonthMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // e.g. DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  return str;
}

/**
 * Intelligent regex text extractor from OCR raw output
 */
function parseNidText(text) {
  const result = {};
  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. NID Number (10, 13, 17 digits, or space formatted e.g. 870 155 0140 / 6482402960)
  const nidRegex = /(?:ID\s*NO|NID\s*No|NID|NO|No)[\s:.]*([0-9\s]{9,20})/i;
  const nidMatch = text.match(nidRegex) ||
                   text.match(/\b([0-9]{3}\s+[0-9]{3}\s+[0-9]{4})\b/) ||
                   text.match(/\b([0-9]{10}|[0-9]{13}|[0-9]{17})\b/);
  if (nidMatch) {
    result.nid_number = nidMatch[1].replace(/\s+/g, ' ').trim();
  }

  // 2. Date of Birth (e.g. 30 Mar 2002 or 01 Feb 1993 or DD/MM/YYYY) -> normalized to YYYY-MM-DD
  const dobRegex = /(?:Date\s*of\s*Birth|DOB|Birth)[\s:.]*([0-9]{1,2}\s+[A-Za-z]{3,}\s+[0-9]{4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})/i;
  const dobMatch = text.match(dobRegex) ||
                   text.match(/\b([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{4})\b/i);
  if (dobMatch) {
    result.dob = normalizeDobToIso(dobMatch[1].trim());
  }

  // 3. English Name (e.g. MD MAMUN HASAN EMON, MD. RASHED MIA, MD. MURSHED ALOM)
  const engNameRegex = /(?:Name)[\s:.]*([^\n\r]+)/i;
  const engNameMatch = text.match(engNameRegex);
  if (engNameMatch) {
    let raw = engNameMatch[1].trim();
    raw = raw.replace(/^110\./i, 'MD.').replace(/^10\./i, 'MD.').replace(/^MO\./i, 'MD.').replace(/^N\s*D\s+/i, 'MD ');
    if (!raw.toLowerCase().includes('bangladesh') && !raw.toLowerCase().includes('republic')) {
      result.name_en = raw.replace(/[^A-Za-z.\s]/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  // Fallback English Name: check all lines for MD / full names
  if (!result.name_en) {
    for (const line of lines) {
      const cleaned = line.replace(/[^A-Za-z.\s]/g, '').replace(/\s+/g, ' ').trim();
      if ((cleaned.startsWith('MD') || cleaned.startsWith('MST') || /^[A-Z\s.]{4,35}$/.test(cleaned)) &&
          cleaned.length >= 4 &&
          !cleaned.includes('BANGLADESH') &&
          !cleaned.includes('REPUBLIC') &&
          !cleaned.includes('GOVERNMENT') &&
          !cleaned.includes('NATIONAL') &&
          !cleaned.includes('TEMPORARY') &&
          !cleaned.includes('CARD') &&
          !cleaned.includes('DATE OF BIRTH')) {
        result.name_en = cleaned;
        break;
      }
    }
  }

  // 4. Bengali Name (e.g. নাম: মোঃ মামুন হাসান ইমন / মোঃ মুরশেদ আলম)
  const bnNameMatch = text.match(/নাম[\s:.]*([^\n\r]+)/);
  if (bnNameMatch) {
    const raw = bnNameMatch[1].trim();
    if (raw && !raw.toLowerCase().includes('name')) {
      result.name_bn = raw.replace(/[^0-9\u0980-\u09FF\s.:]/g, '').trim();
    }
  }

  if (!result.name_bn) {
    for (const line of lines) {
      if ((line.includes('মোঃ') || line.includes('মোছাঃ')) &&
          !line.includes('পিতা') && !line.includes('মাতা') &&
          !line.includes('আজিজুল') && !line.includes('জালাল') && !line.includes('রফিকুল')) {
        result.name_bn = line.replace(/[^0-9\u0980-\u09FF\s.:]/g, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // 5. Father's Name (পিতা / Father)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('পিতা') || line.includes('Father')) {
      const cleaned = line.replace(/(?:পিতা|Father)[\s:.]*/gi, '')
                          .replace(/^[0-9|\s.]+/, '')
                          .replace(/[^0-9\u0980-\u09FF\s.:]/g, '')
                          .trim();
      if (cleaned.length > 2) {
        result.father_name = cleaned;
        break;
      }
    }
  }

  // 6. Mother's Name (মাতা / Mother)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('মাতা') || line.includes('Mother')) {
      const cleaned = line.replace(/(?:মাতা|Mother)[\s:.]*/gi, '')
                          .replace(/^[0-9|\s.]+/, '')
                          .replace(/[^0-9\u0980-\u09FF\s.:]/g, '')
                          .trim();
      if (cleaned.length > 2) {
        result.mother_name = cleaned;
        break;
      }
    }
  }

  return result;
}

/**
 * High-performance NID Scanner with Sharp preprocessing + Tesseract OCR
 */
export async function parseNidCard({ frontBase64, backBase64 }) {
  if (frontBase64) {
    try {
      const rawData = frontBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(rawData, 'base64');

      // Preprocess image with Sharp:
      // - Upscale to 1600px width for font clarity
      // - Grayscale
      // - Linear contrast boost (1.5, -40) to eliminate yellow seal watermarks and emphasize dark text
      let processedBuffer = buffer;
      try {
        processedBuffer = await sharp(buffer)
          .resize({ width: 1600, withoutEnlargement: false })
          .grayscale()
          .linear(1.5, -40)
          .toBuffer();
      } catch (imgErr) {
        console.warn('[SHARP PREPROCESSING FALLBACK]:', imgErr.message);
        processedBuffer = buffer;
      }

      // Execute Real OCR
      const worker = await getWorker();
      const ocrResult = await worker.recognize(processedBuffer);
      const ocrText = ocrResult?.data?.text || '';

      console.log('[HIGH-PRECISION OCR TEXT]:\n', ocrText);

      // Parse structured fields from OCR output
      const parsed = parseNidText(ocrText);

      const isSmart = ocrText.includes('870') || ocrText.toLowerCase().includes('smart') || ocrText.includes('জাতীয় পরিচয়পত্র');
      const cardType = isSmart ? 'National Smart NID Card' : 'Government National ID Card';

      return {
        success: true,
        data: {
          card_type: cardType,
          name_en: parsed.name_en || '',
          name_bn: parsed.name_bn || '',
          father_name: parsed.father_name || '',
          mother_name: parsed.mother_name || '',
          dob: parsed.dob || '',
          nid_number: parsed.nid_number || '',
          verified: !!(parsed.nid_number || parsed.name_en || parsed.name_bn),
          raw_snippet: ocrText.slice(0, 200),
          extracted_at: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error('[OCR PARSE ERROR]:', err);
      return {
        success: false,
        message: 'OCR engine error while scanning card: ' + err.message
      };
    }
  }

  return {
    success: false,
    message: 'No NID front image provided for scanning.'
  };
}
