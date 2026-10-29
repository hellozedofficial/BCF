import React, { useState, useEffect } from 'react';
import ImageEditorModal from './ImageEditorModal';
import { API_BASE, SERVER_BASE } from '../config/api';

const CURRENT_YEAR = new Date().getFullYear();

// Generate year options from 1980 down to current year
const YEAR_OPTIONS = [];
for (let y = CURRENT_YEAR; y >= 1980; y--) {
  YEAR_OPTIONS.push(y);
}

const TRANSLATIONS = {
  en: {
    backToPortal: 'Back to Federation Portal',
    portalSubtitle: 'NATIONAL PLAYER PORTAL',
    fedTitle: 'Bangladesh Carrom Federation',
    fedBangla: 'বাংলাদেশ ক্যারম ফেডারেশন',
    standardsTitle: 'Official Player Registration Standards',
    standard1: 'Automatic sequential National Player ID assignment (Format: BCF[YEAR][MONTH][ID]).',
    standard2: 'Automated real-time NID OCR scanning supporting laminated paper & digital Smart cards.',
    standard3: 'Verified nationwide geocoding database for Present & Permanent addresses across all 64 districts.',
    standard4: 'Direct eligibility for National Rankings, Masters Championships & affiliated Carrom Clubs.',
    affiliatedText: 'Affiliated with NSC, ACF & ICF',
    step1Tab: 'Account & Playing Year',
    step2Tab: 'NID & Photo Upload',
    step3Tab: 'Address & Profile',
    step1Title: 'Step 1: Account Credentials & Playing History',
    step1Desc: 'Set up your portal login credentials and specify your active carrom involvement year.',
    emailLabel: 'Email Address *',
    phoneLabel: 'Mobile Phone Number *',
    passLabel: 'Account Password *',
    confirmPassLabel: 'Confirm Password *',
    showPass: 'Show passwords in plain text',
    playerSinceLabel: 'Player Since (Year) *',
    newPlayerCheckbox: 'I am a new player (Current Year)',
    playerSinceDesc: 'Select the initial calendar year when you commenced playing competitive carrom. If you are entering the federation this season, check the box above.',
    proceedStep2: 'Proceed to Step 2: NID & Photo',
    step2Title: 'Step 2: Photo, National ID (NID) & Automated Extraction',
    step2Desc: 'Upload your passport photo and NID card. You can crop, rotate, and adjust your images before submission.',
    playerPhotoTitle: 'Player Passport Photo *',
    nidFrontTitle: 'NID Front Side *',
    nidBackTitle: 'NID Back Side *',
    clickToUploadPhoto: 'Click to Upload Photo',
    clickToUploadFront: 'Click to Upload NID Front',
    clickToUploadBack: 'Click to Upload NID Back',
    replaceImage: 'Replace Image',
    editCropBtn: 'Crop/Rotate',
    downloadFormBtn: 'Download Official Application Form (PDF)',
    fileTypesHint: 'Supports PNG, JPG (Auto-compressed < 500KB)',
    scanningMsg: 'Scanning card with OCR and extracting identity data...',
    extractedHeader: 'Official Player Profile Information',
    extractedSub: 'Auto-extracted from your card image. You can verify and edit any field if needed.',
    verifiedBadge: 'Visual Verified',
    nameEnLabel: 'Full Name (English)',
    nameBnLabel: 'Full Name (বাংলা)',
    nicknameLabel: 'Nickname (ডাকনাম)',
    fatherLabel: "Father's Name (পিতা)",
    motherLabel: "Mother's Name (মাতা)",
    dobLabel: 'Date of Birth (DOB)',
    nidNumLabel: 'National ID Number',
    genderLabel: 'Player Gender *',
    genderMen: 'Male (Men)',
    genderWomen: 'Female (Women)',
    backStep1: '← Back to Step 1',
    proceedStep3: 'Proceed to Step 3: Address & Profile',
    step3Title: 'Step 3: Residential Address & District Hierarchy',
    step3Desc: 'Select your residential address. Divisions, Districts, Upazilas, and Unions are linked directly with the official Bangladesh geocoding repository.',
    presentAddressHeader: '1. Present Residential Address',
    streetLabel: 'Street Address / Holding / Village / Road *',
    divisionLabel: 'Division (বিভাগ) *',
    districtLabel: 'District (জেলা) *',
    upazilaLabel: 'Upazila / Thana (উপজেলা/থানা)',
    unionLabel: 'Union / Ward (ইউনিয়ন/ওয়ার্ড)',
    zipLabel: 'Postal / Zip Code',
    selectDivision: 'Select Division',
    selectDistrict: 'Select District',
    selectUpazila: 'Select Upazila',
    selectUnion: 'Select Union',
    permanentAddressHeader: '2. Permanent Address',
    sameAsPresentLabel: 'Same as Present Address',
    permanentStreetLabel: 'Permanent Street Address / Village *',
    permanentDivisionLabel: 'Permanent Division *',
    permanentDistrictLabel: 'Permanent District *',
    permanentUpazilaLabel: 'Permanent Upazila',
    permanentUnionLabel: 'Permanent Union',
    permanentZipLabel: 'Postal / Zip Code',
    syncedNotice: 'Permanent address is synchronized automatically with present residential address.',
    backStep2: '← Back to Step 2',
    submitBtn: 'Complete National Registration',
    submittingBtn: 'Completing Registration...',
    successTitle: 'Registration Completed Successfully',
    successDesc: 'Your player identity has been officially cataloged in the National Carrom Federation registry.',
    officialCardTitle: 'Official Player Identity Card',
    playerIdLabel: 'Player ID Number',
    copyIdBtn: 'Copy Player ID',
    viewDirectoryBtn: 'View in Players Directory',
    copiedAlert: 'Player ID copied to clipboard:',
    errorRequired: 'Please fill in all required fields.',
    errorEmail: 'Please provide a valid email address.',
    errorPhone: 'Please enter a valid mobile number.',
    errorPassLength: 'Password must be at least 6 characters long.',
    errorPassMatch: 'Passwords do not match.',
    errorNidRequired: 'Please upload a valid NID card and ensure information is extracted.',
    errorNidBackRequired: 'NID card back side is mandatory. Please upload the back side image.',
    errorAddressRequired: 'Please complete required Present Address fields (Street, Division, District).',
    errorPermanentRequired: 'Please complete required Permanent Address fields.'
  },
  bn: {
    backToPortal: 'মূল পোর্টালে ফেরত যান',
    portalSubtitle: 'জাতীয় খেলোয়াড় নিবন্ধন পোর্টাল',
    fedTitle: 'বাংলাদেশ ক্যারম ফেডারেশন',
    fedBangla: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত',
    standardsTitle: 'অফিসিয়াল প্লেয়ার রেজিস্ট্রেশন স্ট্যান্ডার্ড',
    standard1: 'স্বয়ংক্রিয় ধারাবাহিক ন্যাশনাল প্লেয়ার আইডি বরাদ্দ (ফরম্যাট: BCF[বছর][মাস][আইডি])।',
    standard2: 'লেমিনেশন পেপার এনআইডি ও ডিজিটাল স্মার্ট এনআইডি উভয় কার্ড থেকেই রিয়েল-টাইম ওসিআর স্ক্যান।',
    standard3: 'সারাদেশের ৬৪ জেলার বিভাগ, জেলা, উপজেলা ও ইউনিয়ন জিওকোড ডেটাবেজের সাথে সরাসরি সমন্বিত।',
    standard4: 'জাতীয় র‍্যাঙ্কিং, মাস্টার্স চ্যাম্পিয়নশিপ ও অনুমোদিত ক্যারম ক্লাবে অংশগ্রহণের সরাসরি সুযোগ।',
    affiliatedText: 'এনএসসি, এসিএফ ও আইসিএফ অনুমোদিত',
    step1Tab: 'অ্যাকাউন্ট ও অভিজ্ঞতা',
    step2Tab: 'এনআইডি ও ছবি আপলোড',
    step3Tab: 'ঠিকানা ও তথ্য',
    step1Title: 'ধাপ ১: অ্যাকাউন্ট ও ক্যারম খেলার বছর',
    step1Desc: 'আপনার পোর্টাল লগইন তথ্য প্রদান করুন এবং কত সাল থেকে ক্যারম খেলছেন তা নির্ধারণ করুন।',
    emailLabel: 'ইমেইল অ্যাড্রেস *',
    phoneLabel: 'মোবাইল ফোন নম্বর *',
    passLabel: 'অ্যাকাউন্ট পাসওয়ার্ড *',
    confirmPassLabel: 'পাসওয়ার্ড নিশ্চিত করুন *',
    showPass: 'পাসওয়ার্ড দৃশ্যমান করুন',
    playerSinceLabel: 'খেলোয়াড় হিসেবে সক্রিয় (সাল) *',
    newPlayerCheckbox: 'আমি নতুন খেলোয়াড় (চলতি বছর)',
    playerSinceDesc: 'আপনি যে বছর থেকে ক্যারম খেলা শুরু করেছেন সেই সালটি নির্বাচন করুন। চলতি মৌসুমে প্রথম খেলতে চাইলে উপরের বক্সে টিক দিন।',
    proceedStep2: 'ধাপ ২: এনআইডি ও ছবি আপলোডে যান',
    step2Title: 'ধাপ ২: ছবি, জাতীয় পরিচয়পত্র (NID) ও তথ্য বিশ্লেষণ',
    step2Desc: 'আপনার পাসপোর্ট সাইজ ছবি ও এনআইডি কার্ড আপলোড করুন। প্রয়োজন অনুযায়ী ছবি ক্রপ ও রোটেট করতে পারেন।',
    playerPhotoTitle: 'খেলোয়াড়ের পাসপোর্ট সাইজ ছবি *',
    nidFrontTitle: 'এনআইডি সামনের পাশ *',
    nidBackTitle: 'এনআইডি পেছনের পাশ *',
    clickToUploadPhoto: 'খেলোয়াড়ের ছবি আপলোড করুন',
    clickToUploadFront: 'এনআইডি সামনের পাশ আপলোড করুন',
    clickToUploadBack: 'এনআইডি পেছনের পাশ আপলোড করুন',
    replaceImage: 'ছবি পরিবর্তন করুন',
    editCropBtn: 'ক্রপ/রোটেট করুন',
    downloadFormBtn: 'অফিসিয়াল আবেদন ফরম ডাউনলোড করুন (PDF)',
    fileTypesHint: 'PNG, JPG ফরম্যাট (সর্বোচ্চ ৫০০ KB-তে কম্প্রেসড)',
    scanningMsg: 'কার্ড থেকে রিয়েল-টাইম ওসিআর স্ক্যান ও তথ্য বিশ্লেষণ করা হচ্ছে...',
    extractedHeader: 'অফিসিয়াল খেলোয়াড় প্রোফাইল তথ্য',
    extractedSub: 'কার্ড থেকে স্বয়ংক্রিয়ভাবে নেওয়া হয়েছে। প্রয়োজন হলে তথ্য দেখে পরিবর্তন বা সংশোধন করতে পারেন।',
    verifiedBadge: 'স্ক্যান সম্পন্ন',
    nameEnLabel: 'পূর্ণ নাম (ইংরেজিতে)',
    nameBnLabel: 'পূর্ণ নাম (বাংলায়)',
    nicknameLabel: 'ডাকনাম (Nickname)',
    fatherLabel: 'পিতার নাম',
    motherLabel: 'মাতার নাম',
    dobLabel: 'জন্ম তারিখ',
    nidNumLabel: 'জাতীয় পরিচয়পত্র নম্বর (NID)',
    genderLabel: 'খেলোয়াড়ের লিঙ্গ (Gender) *',
    genderMen: 'পুরুষ (Men)',
    genderWomen: 'মহিলা (Women)',
    backStep1: '← ধাপ ১-এ ফেরত যান',
    proceedStep3: 'ধাপ ৩: ঠিকানায় যান',
    step3Title: 'ধাপ ৩: বর্তমান ও স্থায়ী আবাসিক ঠিকানা',
    step3Desc: 'আপনার বর্তমান ও স্থায়ী ঠিকানা নির্বাচন করুন। বাংলাদেশ জিওকোড ডেটাবেজ থেকে বিভাগ, জেলা, উপজেলা ও ইউনিয়ন তালিকাভুক্ত।',
    presentAddressHeader: '১. বর্তমান আবাসিক ঠিকানা',
    streetLabel: 'রাস্তা / বাড়ি নং / গ্রাম / হোল্ডিং *',
    divisionLabel: 'বিভাগ *',
    districtLabel: 'জেলা *',
    upazilaLabel: 'উপজেলা / থানা',
    unionLabel: 'ইউনিয়ন / ওয়ার্ড',
    zipLabel: 'পোস্টাল / জিপ কোড',
    selectDivision: 'বিভাগ নির্বাচন করুন',
    selectDistrict: 'জেলা নির্বাচন করুন',
    selectUpazila: 'উপজেলা নির্বাচন করুন',
    selectUnion: 'ইউনিয়ন নির্বাচন করুন',
    permanentAddressHeader: '২. স্থায়ী ঠিকানা',
    sameAsPresentLabel: 'বর্তমান ও স্থায়ী ঠিকানা একই',
    permanentStreetLabel: 'স্থায়ী রাস্তা / বাড়ি নং / গ্রাম *',
    permanentDivisionLabel: 'স্থায়ী বিভাগ *',
    permanentDistrictLabel: 'স্থায়ী জেলা *',
    permanentUpazilaLabel: 'স্থায়ী উপজেলা / থানা',
    permanentUnionLabel: 'স্থায়ী ইউনিয়ন / ওয়ার্ড',
    permanentZipLabel: 'পোস্টাল / জিপ কোড',
    syncedNotice: 'স্থায়ী ঠিকানা বর্তমান আবাসিক ঠিকানার সাথে স্বয়ংক্রিয়ভাবে সমন্বিত রয়েছে।',
    backStep2: '← ধাপ ২-এ ফেরত যান',
    submitBtn: 'জাতীয় খেলোয়াড় নিবন্ধন সম্পন্ন করুন',
    submittingBtn: 'নিবন্ধন সম্পন্ন হচ্ছে...',
    successTitle: 'আবেদন সফলভাবে গৃহীত হয়েছে (অনুমোদনের অপেক্ষায়)',
    successDesc: 'আপনার প্লেয়ার আবেদনটি জমা হয়েছে। ফেডারেশন অ্যাডমিন পর্যালোচনা শেষে এটি অনুমোদিত হবে।',
    officialCardTitle: 'খেলোয়াড় নিবন্ধন আবেদন কার্ড',
    playerIdLabel: 'প্লেয়ার আইডি নম্বর',
    copyIdBtn: 'প্লেয়ার আইডি কপি করুন',
    viewDirectoryBtn: 'খেলোয়াড়দের তালিকায় দেখুন',
    copiedAlert: 'প্লেয়ার আইডি ক্লিপবোর্ডে কপি করা হয়েছে:',
    errorRequired: 'দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন।',
    errorEmail: 'একটি সঠিক ইমেইল ঠিকানা দিন।',
    errorPhone: 'সঠিক মোবাইল নম্বর দিন।',
    errorPassLength: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    errorPassMatch: 'পাসওয়ার্ড দুটি মিলছে না।',
    errorPhotoRequired: 'খেলোয়াড়ের পাসপোর্ট সাইজ ছবি আপলোড করা বাধ্যতামূলক।',
    errorNidRequired: 'দয়া করে সঠিক এনআইডি কার্ড দিন এবং তথ্য এক্সট্রাক্ট নিশ্চিত করুন।',
    errorNidBackRequired: 'এনআইডি কার্ডের পেছনের পাশ আপলোড করা বাধ্যতামূলক।',
    errorAddressRequired: 'দয়া করে বর্তমান ঠিকানার রাস্তা, বিভাগ ও জেলা পূরণ করুন।',
    errorPermanentRequired: 'দয়া করে স্থায়ী ঠিকানার প্রয়োজনীয় তথ্য পূরণ করুন।'
  }
};

const SunIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function normalizeDobToIso(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
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

export default function PlayerRegister({ navigateTo, theme = 'light', toggleTheme }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('bcf_lang') === 'bn' ? 'bn' : 'en';
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleLangToggle = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bcf_lang', newLang);
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // STEP 1 STATE: Credentials & Player History
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [playerSince, setPlayerSince] = useState(CURRENT_YEAR);

  // STEP 2 STATE: Documents, Photo & Extracted Profile
  const [playerPhoto, setPlayerPhoto] = useState(null);
  const [playerPhotoPreview, setPlayerPhotoPreview] = useState('');
  const [nidFront, setNidFront] = useState(null);
  const [nidFrontPreview, setNidFrontPreview] = useState('');
  const [nidBack, setNidBack] = useState(null);
  const [nidBackPreview, setNidBackPreview] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState({
    name_bn: '',
    name_en: '',
    nickname: '',
    gender: 'Men',
    father_name: '',
    mother_name: '',
    dob: '',
    nid_number: '',
    photo_url: '',
    card_type: ''
  });

  // Image Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null); // 'photo' | 'front' | 'back'
  const [editingImageSrc, setEditingImageSrc] = useState('');
  const [editorRatio, setEditorRatio] = useState('square');
  const [editorTitle, setEditorTitle] = useState('');

  // STEP 3 STATE: Addresses (Geocode Data)
  const [divisions, setDivisions] = useState([]);

  // Present Address
  const [presentStreet, setPresentStreet] = useState('');
  const [presentDivisionId, setPresentDivisionId] = useState('');
  const [presentDistricts, setPresentDistricts] = useState([]);
  const [presentDistrictId, setPresentDistrictId] = useState('');
  const [presentUpazilas, setPresentUpazilas] = useState([]);
  const [presentUpazilaId, setPresentUpazilaId] = useState('');
  const [presentUnions, setPresentUnions] = useState([]);
  const [presentUnionId, setPresentUnionId] = useState('');
  const [presentZip, setPresentZip] = useState('');

  // Permanent Address
  const [sameAsPresent, setSameAsPresent] = useState(true);
  const [permanentStreet, setPermanentStreet] = useState('');
  const [permanentDivisionId, setPermanentDivisionId] = useState('');
  const [permanentDistricts, setPermanentDistricts] = useState([]);
  const [permanentDistrictId, setPermanentDistrictId] = useState('');
  const [permanentUpazilas, setPermanentUpazilas] = useState([]);
  const [permanentUpazilaId, setPermanentUpazilaId] = useState('');
  const [permanentUnions, setPermanentUnions] = useState([]);
  const [permanentUnionId, setPermanentUnionId] = useState('');
  const [permanentZip, setPermanentZip] = useState('');

  // Initial load of Divisions
  useEffect(() => {
    fetch(`${API_BASE}/geocode/divisions`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDivisions(data.data);
        }
      })
      .catch(err => console.error('Error fetching divisions:', err));
  }, []);

  // Present Address Cascades
  useEffect(() => {
    if (!presentDivisionId) {
      setPresentDistricts([]);
      setPresentDistrictId('');
      return;
    }
    fetch(`${API_BASE}/geocode/districts?division_id=${presentDivisionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPresentDistricts(data.data);
          setPresentDistrictId('');
        }
      });
  }, [presentDivisionId]);

  useEffect(() => {
    if (!presentDistrictId) {
      setPresentUpazilas([]);
      setPresentUpazilaId('');
      return;
    }
    fetch(`${API_BASE}/geocode/upazilas?district_id=${presentDistrictId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPresentUpazilas(data.data);
          setPresentUpazilaId('');
        }
      });
  }, [presentDistrictId]);

  useEffect(() => {
    if (!presentUpazilaId) {
      setPresentUnions([]);
      setPresentUnionId('');
      return;
    }
    fetch(`${API_BASE}/geocode/unions?upazila_id=${presentUpazilaId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPresentUnions(data.data);
          setPresentUnionId('');
        }
      });
  }, [presentUpazilaId]);

  // Permanent Address Cascades (when sameAsPresent is false)
  useEffect(() => {
    if (sameAsPresent || !permanentDivisionId) {
      setPermanentDistricts([]);
      setPermanentDistrictId('');
      return;
    }
    fetch(`${API_BASE}/geocode/districts?division_id=${permanentDivisionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPermanentDistricts(data.data);
          setPermanentDistrictId('');
        }
      });
  }, [permanentDivisionId, sameAsPresent]);

  useEffect(() => {
    if (sameAsPresent || !permanentDistrictId) {
      setPermanentUpazilas([]);
      setPermanentUpazilaId('');
      return;
    }
    fetch(`${API_BASE}/geocode/upazilas?district_id=${permanentDistrictId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPermanentUpazilas(data.data);
          setPermanentUpazilaId('');
        }
      });
  }, [permanentDistrictId, sameAsPresent]);

  useEffect(() => {
    if (sameAsPresent || !permanentUpazilaId) {
      setPermanentUnions([]);
      setPermanentUnionId('');
      return;
    }
    fetch(`${API_BASE}/geocode/unions?upazila_id=${permanentUpazilaId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPermanentUnions(data.data);
          setPermanentUnionId('');
        }
      });
  }, [permanentUpazilaId, sameAsPresent]);

  // Handle "New Player" toggle
  const handleNewPlayerToggle = (checked) => {
    setIsNewPlayer(checked);
    if (checked) {
      setPlayerSince(CURRENT_YEAR);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setErrorMsg('');
    if (!email || !phone || !password || !confirmPassword) {
      setErrorMsg(t.errorRequired);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg(t.errorEmail);
      return false;
    }
    if (phone.length < 10) {
      setErrorMsg(t.errorPhone);
      return false;
    }
    if (password.length < 6) {
      setErrorMsg(t.errorPassLength);
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t.errorPassMatch);
      return false;
    }
    return true;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Image Editor Open Helper
  const openEditorFor = (type, currentSrc, title, ratio) => {
    setEditingTarget(type);
    setEditingImageSrc(currentSrc);
    setEditorTitle(title);
    setEditorRatio(ratio);
    setEditorOpen(true);
  };

  const handleEditorConfirm = (editedDataUrl) => {
    if (editingTarget === 'photo') {
      setPlayerPhotoPreview(editedDataUrl);
      setExtractedData(prev => ({ ...prev, photo_url: editedDataUrl }));
    } else if (editingTarget === 'front') {
      setNidFrontPreview(editedDataUrl);
      triggerNidExtraction(editedDataUrl, null, null);
    } else if (editingTarget === 'back') {
      setNidBackPreview(editedDataUrl);
    }
    setEditorOpen(false);
  };

  // Auto center-crop to 1:1 square canvas
  const autoCropSquare = (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 600, 600);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Process File Uploads (Photo, NID Front, NID Back)
  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (type === 'photo') {
        autoCropSquare(base64).then((squareBase64) => {
          setPlayerPhoto(file);
          setPlayerPhotoPreview(squareBase64);
          setExtractedData(prev => ({ ...prev, photo_url: squareBase64 }));
          openEditorFor('photo', squareBase64, t.playerPhotoTitle, 'square');
        });
      } else if (type === 'front') {
        setNidFront(file);
        setNidFrontPreview(base64);
        triggerNidExtraction(base64, null, null);
      } else {
        setNidBack(file);
        setNidBackPreview(base64);
        if (!extractedData.nid_number && !nidFrontPreview) {
          triggerNidExtraction(null, base64, null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger OCR Extraction (or preset)
  const triggerNidExtraction = async (frontBase64, backBase64, presetHint) => {
    setExtracting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/player-register/parse-nid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontBase64, backBase64, presetHint })
      });
      const data = await res.json();
      if (data.success) {
        setExtractedData(prev => ({
          name_bn: data.data.name_bn || prev.name_bn || '',
          name_en: data.data.name_en || prev.name_en || '',
          nickname: prev.nickname || '',
          gender: prev.gender || 'Men',
          father_name: data.data.father_name || prev.father_name || '',
          mother_name: data.data.mother_name || prev.mother_name || '',
          dob: normalizeDobToIso(data.data.dob) || prev.dob || '',
          nid_number: data.data.nid_number || prev.nid_number || '',
          photo_url: prev.photo_url || data.data.sample_preview || nidFrontPreview || '',
          card_type: data.data.card_type || prev.card_type || ''
        }));
        if (data.data.sample_preview && !nidFrontPreview) {
          setNidFrontPreview(data.data.sample_preview);
        }
      } else {
        setErrorMsg(data.message || 'Failed to extract NID information.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to NID scanning service.');
    } finally {
      setExtracting(false);
    }
  };

  // Step 2 Validation (Photo, NID Front & Back are all mandatory)
  const validateStep2 = () => {
    setErrorMsg('');
    if (!playerPhotoPreview) {
      setErrorMsg(t.errorPhotoRequired);
      return false;
    }
    if (!nidFrontPreview || !extractedData.nid_number || !extractedData.name_en) {
      setErrorMsg(t.errorNidRequired);
      return false;
    }
    if (!nidBackPreview) {
      setErrorMsg(t.errorNidBackRequired);
      return false;
    }
    return true;
  };

  const handleStep2Next = () => {
    if (validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 3 Submission
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!playerPhotoPreview) {
      setErrorMsg(t.errorPhotoRequired);
      return;
    }

    if (!nidFrontPreview || !extractedData.nid_number) {
      setErrorMsg(t.errorNidRequired);
      return;
    }

    if (!nidBackPreview) {
      setErrorMsg(t.errorNidBackRequired);
      return;
    }

    if (!presentStreet || !presentDivisionId || !presentDistrictId) {
      setErrorMsg(t.errorAddressRequired);
      return;
    }

    if (!sameAsPresent && (!permanentStreet || !permanentDivisionId || !permanentDistrictId)) {
      setErrorMsg(t.errorPermanentRequired);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        phone,
        password,
        player_since: parseInt(playerSince, 10),
        is_new_player: isNewPlayer,
        name_en: extractedData.name_en,
        name_bn: extractedData.name_bn,
        nickname: extractedData.nickname,
        gender: extractedData.gender || 'Men',
        father_name: extractedData.father_name,
        mother_name: extractedData.mother_name,
        dob: extractedData.dob,
        nid_number: extractedData.nid_number,
        photo_url: playerPhotoPreview || extractedData.photo_url || nidFrontPreview,
        nid_front_url: nidFrontPreview,
        nid_back_url: nidBackPreview,
        present_street: presentStreet,
        present_division_id: parseInt(presentDivisionId, 10),
        present_district_id: parseInt(presentDistrictId, 10),
        present_upazila_id: presentUpazilaId ? parseInt(presentUpazilaId, 10) : null,
        present_union_id: presentUnionId ? parseInt(presentUnionId, 10) : null,
        present_zip: presentZip,
        permanent_street: sameAsPresent ? presentStreet : permanentStreet,
        permanent_division_id: sameAsPresent ? parseInt(presentDivisionId, 10) : (permanentDivisionId ? parseInt(permanentDivisionId, 10) : null),
        permanent_district_id: sameAsPresent ? parseInt(presentDistrictId, 10) : (permanentDistrictId ? parseInt(permanentDistrictId, 10) : null),
        permanent_upazila_id: sameAsPresent ? (presentUpazilaId ? parseInt(presentUpazilaId, 10) : null) : (permanentUpazilaId ? parseInt(permanentUpazilaId, 10) : null),
        permanent_union_id: sameAsPresent ? (presentUnionId ? parseInt(presentUnionId, 10) : null) : (permanentUnionId ? parseInt(permanentUnionId, 10) : null),
        permanent_zip: sameAsPresent ? presentZip : permanentZip,
        same_as_present: sameAsPresent
      };

      const res = await fetch(`${API_BASE}/player-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSuccessData(resData.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(resData.message || 'Registration failed. Please check your data.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="player-register-container" style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.25s ease, color 0.25s ease'
    }}>
      {/* 
        LEFT SIDE: FEDERATION BRANDING & VERIFICATION OVERVIEW
        Clean dark green background with subtle, refined gradient
      */}
      <div className="register-left-panel" style={{
        flex: '0 0 42%',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        background: 'linear-gradient(160deg, #064E3B 0%, #047857 55%, #065F46 100%)',
        color: '#FFFFFF',
        padding: '48px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: isDark ? '1px solid #1E293B' : '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Top Back Navigation */}
        <div>
          <button
            onClick={() => navigateTo('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.backToPortal}
          </button>
        </div>

        {/* Center: Federation Logo & Header (Centered Top-to-Bottom) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          margin: 'auto 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img
              src="/01M3YBY0TBEXJA8T8H0SWPY123.png"
              alt="Bangladesh Carrom Federation"
              style={{
                width: '74px',
                height: '74px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#A7F3D0'
              }}>
                {t.portalSubtitle}
              </div>
              <h1 style={{
                fontSize: '25px',
                fontWeight: '800',
                lineHeight: '1.25',
                color: '#FFFFFF',
                margin: '4px 0 2px 0'
              }}>
                {t.fedTitle}
              </h1>
              <div style={{
                fontSize: '13.5px',
                color: 'rgba(255, 255, 255, 0.85)',
                marginTop: '2px'
              }}>
                {t.fedBangla}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '20px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.75)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{t.affiliatedText}</span>
          <span>bcf.org.bd</span>
        </div>
      </div>

      {/* 
        RIGHT SIDE: 3-STEP REGISTRATION WIZARD
        Clean, modern form with robust dark mode and bilingual support
      */}
      <div className="register-right-panel" style={{
        flex: '1 1 58%',
        padding: '40px 56px',
        maxWidth: '840px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        {/* Top Control Bar: Language Switcher + Dark Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {/* Language Toggle Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            padding: '3px',
            gap: '2px'
          }}>
            <button
              type="button"
              onClick={() => handleLangToggle('en')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: lang === 'en' ? 'var(--accent-green)' : 'transparent',
                color: lang === 'en' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: lang === 'en' ? '700' : '600',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLangToggle('bn')}
              style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: lang === 'bn' ? 'var(--accent-green)' : 'transparent',
                color: lang === 'bn' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: lang === 'bn' ? '700' : '600',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              বাংলা
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Dark / Light Theme"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? '#F59E0B' : '#047857',
              transition: 'all 0.2s ease'
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* STEPPER: ELEGANT 3-CARD GRID WITH ZERO OVERFLOW AND ZERO OVERLAPPING LINES */}
        {!successData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '32px'
          }}>
            {[
              { num: 1, label: t.step1Tab },
              { num: 2, label: t.step2Tab },
              { num: 3, label: t.step3Tab }
            ].map((s) => {
              const isActive = step === s.num;
              const isPassed = step > s.num;
              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isActive ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(4, 120, 87, 0.08)') : 'var(--bg-elevated)',
                    border: isActive ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.25s ease',
                    minWidth: 0
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isPassed ? 'var(--accent-green)' : (isActive ? 'var(--accent-green)' : 'var(--bg-surface)'),
                    color: isPassed || isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '13px',
                    border: isPassed || isActive ? 'none' : '1px solid var(--border-subtle)'
                  }}>
                    {isPassed ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </div>
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '10.5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: '700',
                      color: isActive ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
                      lineHeight: '1.2'
                    }}>
                      {lang === 'bn' ? `ধাপ ${s.num}` : `Step ${s.num}`}
                    </div>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }} title={s.label}>
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Error Notice */}
        {errorMsg && (
          <div style={{
            background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            border: isDark ? '1px solid #7F1D1D' : '1px solid #FCA5A5',
            color: isDark ? '#FCA5A5' : '#991B1B',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '700' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* SUCCESS VIEW: DIGITAL PLAYER IDENTITY CARD */}
        {successData ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: 'var(--card-shadow)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: 'var(--accent-green-light)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D',
              fontSize: '12.5px',
              fontWeight: '700',
              marginBottom: '16px'
            }}>
              {t.successTitle}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
              {t.successDesc}
            </p>

            {/* Official ID Card Cardboard (3.375 : 2.125 Standard ID Card Ratio) */}
            <div style={{
              background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px 24px',
              maxWidth: '460px',
              width: '100%',
              aspectRatio: '3.375 / 2.125',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              margin: '0 auto 24px',
              textAlign: 'left',
              boxShadow: '0 12px 28px rgba(4, 120, 87, 0.28)',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              {/* Header without Senior badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/01M3YBY0TBEXJA8T8H0SWPY123.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: '#A7F3D0' }}>BANGLADESH CARROM FEDERATION</div>
                    <div style={{ fontSize: '13px', fontWeight: '800' }}>{t.officialCardTitle}</div>
                  </div>
                </div>
              </div>

              {/* Card Body: Player Photo & Identity Details */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                <img
                  src={
                    (playerPhotoPreview && playerPhotoPreview.startsWith('data:') ? playerPhotoPreview : '') ||
                    (successData.photo_url ? (successData.photo_url.startsWith('http') || successData.photo_url.startsWith('data:') ? successData.photo_url : `${SERVER_BASE}${successData.photo_url}`) : '') ||
                    playerPhotoPreview ||
                    '/01M3YBY0TBEXJA8T8H0SWPY123.png'
                  }
                  alt="Player Photo"
                  onError={(e) => {
                    if (playerPhotoPreview && e.currentTarget.src !== playerPhotoPreview) {
                      e.currentTarget.src = playerPhotoPreview;
                    }
                  }}
                  style={{
                    width: '92px',
                    height: '92px',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.35)',
                    background: '#1E293B',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)'
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.playerIdLabel}
                  </div>
                  <div style={{
                    fontSize: '17px',
                    fontWeight: '800',
                    letterSpacing: '0.04em',
                    color: '#FDE047',
                    marginBottom: '4px'
                  }}>
                    {successData.player_id}
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {successData.name_en} {successData.nickname ? `(${successData.nickname})` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#E2E8F0', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {successData.name_bn}
                  </div>

                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Player Since: <strong>{successData.player_since}</strong> • District: <strong>{successData.district}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Official 300 Taka Fee & Address Guideline Card */}
            <div style={{
              background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
              border: '1px dashed #F59E0B',
              borderRadius: '12px',
              padding: '18px 22px',
              maxWidth: '480px',
              margin: '0 auto 28px',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: '700', color: '#B45309', fontSize: '14px', marginBottom: '6px' }}>
                {lang === 'bn' ? 'নিবন্ধন ফি ও একাউন্ট অ্যাক্টিভেশন শর্তাবলী:' : 'Registration Fee & Activation Guidelines:'}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#FDE68A' : '#78350F', lineHeight: '1.6' }}>
                {lang === 'bn' ? (
                  <>
                    ১. একাউন্ট অ্যাক্টিভেশনের জন্য <strong>৩০০/- (তিনশত) টাকা ফি</strong> প্রদান করতে হবে।<br />
                    ২. নিচে দেওয়া <strong>অফিসিয়াল আবেদন ফরমটি (PDF)</strong> ডাউনলোড ও প্রিন্ট করে মূল এনআইডি কার্ডসহ সরাসরি ফেডারেশনের অফিসে উপস্থিত হয়ে জমা দিন:<br />
                    <strong>মওলানা ভাসানী হকি স্টেডিয়াম, রুম নং ২৩৫/২৬৬/২৬৮/২৬৯/২৭০, ঢাকা-১০০০</strong>।<br />
                    ৩. আবেদনের তথ্য যাচাই শেষে অ্যাডমিন থেকে চূড়ান্ত অনুমোদন (Approve) দেওয়া হবে।
                  </>
                ) : (
                  <>
                    1. A fee of <strong>৳300</strong> must be deposited for account activation.<br />
                    2. Please download and print the <strong>Official Application Form (PDF)</strong> below and visit the Federation headquarters with your original NID card:<br />
                    <strong>Moulana Bhashani Hockey Stadium, Room No: 235-270, Dhaka-1000</strong>.<br />
                    3. After physical verification, administrative approval will be granted.
                  </>
                )}
              </p>
            </div>

            {/* Action Buttons: Download PDF & Copy ID */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`${API_BASE}/player-register/download-form/${successData.player_id}`}
                download={`BCF_Application_Form_${successData.player_id}.pdf`}
                style={{
                  padding: '11px 26px',
                  borderRadius: '8px',
                  background: 'var(--accent-green)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {t.downloadFormBtn}
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(successData.player_id);
                  alert(`${t.copiedAlert} ${successData.player_id}`);
                }}
                style={{
                  padding: '11px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {t.copyIdBtn}
              </button>

              <button
                type="button"
                onClick={() => navigateTo('/')}
                style={{
                  padding: '11px 22px',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {t.backToPortal}
              </button>
            </div>
          </div>
        ) : (
          /* STEP FORMS */
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: 'var(--card-shadow)'
          }}>
            {/* STEP 1: CREDENTIALS & PLAYING YEAR */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {t.step1Title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
                  {t.step1Desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {t.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {t.passLabel}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      {t.confirmPassLabel}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="showPass"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                  />
                  <label htmlFor="showPass" style={{ fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    {t.showPass}
                  </label>
                </div>

                {/* Player Since & New Player Toggle */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {t.playerSinceLabel}
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: 'var(--accent-green-light)' }}>
                      <input
                        type="checkbox"
                        checked={isNewPlayer}
                        onChange={(e) => handleNewPlayerToggle(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                      />
                      <span>{t.newPlayerCheckbox}</span>
                    </label>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    {t.playerSinceDesc}
                  </p>

                  <select
                    className="select-input"
                    value={playerSince}
                    onChange={(e) => setPlayerSince(parseInt(e.target.value, 10))}
                    disabled={isNewPlayer}
                    style={{
                      width: '100%',
                      fontWeight: '600'
                    }}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Next Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleStep1Next}
                    style={{
                      background: 'var(--accent-green)',
                      color: '#FFFFFF',
                      padding: '11px 28px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    {t.proceedStep2}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: NID UPLOAD & REAL-TIME OCR SCANNING */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {t.step2Title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
                  {t.step2Desc}
                </p>



                {/* Upload Cards Grid: Photo (1:1), NID Front (16:10), NID Back (16:10) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px'
                }}>
                  {/* 1. Player Passport Photo */}
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        {t.playerPhotoTitle}
                      </div>
                      {playerPhotoPreview ? (
                        <div>
                          <img
                            src={playerPhotoPreview}
                            alt="Player Photo Preview"
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              margin: '0 auto 10px',
                              display: 'block',
                              border: '1px solid var(--border-subtle)'
                            }}
                          />
                        </div>
                      ) : (
                        <label style={{
                          display: 'block',
                          padding: '24px 10px',
                          border: '2px dashed var(--border-strong)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{t.clickToUploadPhoto}</div>
                          <div style={{ fontSize: '11px' }}>1:1 পাসপোর্ট সাইজ</div>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>

                    {playerPhotoPreview && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditorFor('photo', playerPhotoPreview, t.playerPhotoTitle, 'square')}
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-green-light)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {t.editCropBtn}
                        </button>
                        <label style={{ fontSize: '11.5px', padding: '4px 8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
                          {t.replaceImage}
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} style={{ display: 'none' }} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 2. NID Front Upload */}
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        {t.nidFrontTitle}
                      </div>
                      {nidFrontPreview ? (
                        <div>
                          <img
                            src={nidFrontPreview}
                            alt="NID Front Preview"
                            style={{
                              width: '100%',
                              maxHeight: '130px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              marginBottom: '10px'
                            }}
                          />
                        </div>
                      ) : (
                        <label style={{
                          display: 'block',
                          padding: '24px 10px',
                          border: '2px dashed var(--border-strong)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{t.clickToUploadFront}</div>
                          <div style={{ fontSize: '11px' }}>{t.fileTypesHint}</div>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>

                    {nidFrontPreview && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditorFor('front', nidFrontPreview, t.nidFrontTitle, 'nid')}
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-green-light)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {t.editCropBtn}
                        </button>
                        <label style={{ fontSize: '11.5px', padding: '4px 8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
                          {t.replaceImage}
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} style={{ display: 'none' }} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 3. NID Back Upload */}
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        {t.nidBackTitle}
                      </div>
                      {nidBackPreview ? (
                        <div>
                          <img
                            src={nidBackPreview}
                            alt="NID Back Preview"
                            style={{
                              width: '100%',
                              maxHeight: '130px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              marginBottom: '10px'
                            }}
                          />
                        </div>
                      ) : (
                        <label style={{
                          display: 'block',
                          padding: '24px 10px',
                          border: '2px dashed var(--border-strong)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{t.clickToUploadBack}</div>
                          <div style={{ fontSize: '11px' }}>{t.fileTypesHint}</div>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>

                    {nidBackPreview && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditorFor('back', nidBackPreview, t.nidBackTitle, 'nid')}
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--accent-green-light)',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {t.editCropBtn}
                        </button>
                        <label style={{ fontSize: '11.5px', padding: '4px 8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
                          {t.replaceImage}
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} style={{ display: 'none' }} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extraction In-Progress Indicator */}
                {extracting && (
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                    borderRadius: '8px',
                    color: isDark ? '#34D399' : '#065F46',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2.5px solid currentColor',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>{t.scanningMsg}</span>
                  </div>
                )}

                {/* EXTRACTED FIELDS (AUTO-FILLED & DIRECTLY EDITABLE FOR MAXIMUM ACCURACY) */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '22px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {t.extractedHeader}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {t.extractedSub}
                      </div>
                    </div>
                    {extractedData.nid_number && (
                      <span style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                        color: isDark ? '#34D399' : '#065F46',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        {t.verifiedBadge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {/* Name EN */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.nameEnLabel} *
                      </label>
                      <input
                        type="text"
                        value={extractedData.name_en}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, name_en: e.target.value }))}
                        placeholder=""
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: 'var(--accent-green-light)',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Name BN */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.nameBnLabel}
                      </label>
                      <input
                        type="text"
                        value={extractedData.name_bn}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, name_bn: e.target.value }))}
                        placeholder=""
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: 'var(--accent-green-light)',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Nickname */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.nicknameLabel}
                      </label>
                      <input
                        type="text"
                        value={extractedData.nickname || ''}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder=""
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: 'var(--accent-green-light)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Father Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.fatherLabel}
                      </label>
                      <input
                        type="text"
                        value={extractedData.father_name}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, father_name: e.target.value }))}
                        placeholder="Father's name"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Mother Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.motherLabel}
                      </label>
                      <input
                        type="text"
                        value={extractedData.mother_name}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, mother_name: e.target.value }))}
                        placeholder="Mother's name"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Date of Birth */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.dobLabel}
                      </label>
                      <input
                        type="date"
                        value={extractedData.dob || ''}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, dob: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          colorScheme: isDark ? 'dark' : 'light',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* NID Number */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.nidNumLabel} *
                      </label>
                      <input
                        type="text"
                        value={extractedData.nid_number}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, nid_number: e.target.value }))}
                        placeholder="e.g. 6462492960"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          fontSize: '13.5px',
                          fontWeight: '700',
                          letterSpacing: '0.04em',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Gender Selection Radio */}
                  <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      {t.genderLabel}
                    </label>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: (extractedData.gender === 'Men' || !extractedData.gender) ? '700' : '500',
                        color: (extractedData.gender === 'Men' || !extractedData.gender) ? 'var(--accent-green-light)' : 'var(--text-primary)'
                      }}>
                        <input
                          type="radio"
                          name="player_gender"
                          value="Men"
                          checked={extractedData.gender === 'Men' || !extractedData.gender}
                          onChange={() => setExtractedData(prev => ({ ...prev, gender: 'Men' }))}
                          style={{ accentColor: 'var(--accent-green)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>{t.genderMen}</span>
                      </label>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: extractedData.gender === 'Women' ? '700' : '500',
                        color: extractedData.gender === 'Women' ? 'var(--accent-green-light)' : 'var(--text-primary)'
                      }}>
                        <input
                          type="radio"
                          name="player_gender"
                          value="Women"
                          checked={extractedData.gender === 'Women'}
                          onChange={() => setExtractedData(prev => ({ ...prev, gender: 'Women' }))}
                          style={{ accentColor: 'var(--accent-green)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>{t.genderWomen}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 2 Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {t.backStep1}
                  </button>

                  <button
                    type="button"
                    onClick={handleStep2Next}
                    disabled={!extractedData.nid_number || !nidBackPreview || !nidFrontPreview || !playerPhotoPreview}
                    style={{
                      background: (extractedData.nid_number && nidBackPreview && nidFrontPreview && playerPhotoPreview) ? 'var(--accent-green)' : 'var(--border-strong)',
                      color: '#FFFFFF',
                      padding: '11px 28px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: (extractedData.nid_number && nidBackPreview && nidFrontPreview && playerPhotoPreview) ? 'pointer' : 'not-allowed',
                      boxShadow: (extractedData.nid_number && nidBackPreview && nidFrontPreview && playerPhotoPreview) ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none'
                    }}
                  >
                    {t.proceedStep3}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PRESENT & PERMANENT ADDRESSES */}
            {step === 3 && (
              <form onSubmit={handleSubmitRegistration}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {t.step3Title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {t.step3Desc}
                </p>

                {/* PRESENT ADDRESS CONTAINER */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '22px',
                  marginBottom: '28px'
                }}>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', marginBottom: '14px', color: 'var(--accent-green-light)' }}>
                    {t.presentAddressHeader}
                  </div>

                  {/* Street Address */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                      {t.streetLabel}
                    </label>
                    <input
                      type="text"
                      value={presentStreet}
                      onChange={(e) => setPresentStreet(e.target.value)}
                      placeholder="e.g. House 45, Road 11, Sector 4"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Division & District */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.divisionLabel}
                      </label>
                      <select
                        className="select-input"
                        value={presentDivisionId}
                        onChange={(e) => setPresentDivisionId(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      >
                        <option value="">{t.selectDivision}</option>
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {lang === 'bn' ? `${d.bn_name} (${d.name})` : `${d.name} (${d.bn_name})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.districtLabel}
                      </label>
                      <select
                        className="select-input"
                        value={presentDistrictId}
                        onChange={(e) => setPresentDistrictId(e.target.value)}
                        disabled={!presentDivisionId}
                        required
                        style={{ width: '100%' }}
                      >
                        <option value="">{t.selectDistrict}</option>
                        {presentDistricts.map((dst) => (
                          <option key={dst.id} value={dst.id}>
                            {lang === 'bn' ? `${dst.bn_name} (${dst.name})` : `${dst.name} (${dst.bn_name})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Upazila & Union */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.upazilaLabel}
                      </label>
                      <select
                        className="select-input"
                        value={presentUpazilaId}
                        onChange={(e) => setPresentUpazilaId(e.target.value)}
                        disabled={!presentDistrictId}
                        style={{ width: '100%' }}
                      >
                        <option value="">{t.selectUpazila}</option>
                        {presentUpazilas.map((u) => (
                          <option key={u.id} value={u.id}>
                            {lang === 'bn' ? `${u.bn_name} (${u.name})` : `${u.name} (${u.bn_name})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                        {t.unionLabel}
                      </label>
                      <select
                        className="select-input"
                        value={presentUnionId}
                        onChange={(e) => setPresentUnionId(e.target.value)}
                        disabled={!presentUpazilaId}
                        style={{ width: '100%' }}
                      >
                        <option value="">{t.selectUnion}</option>
                        {presentUnions.map((un) => (
                          <option key={un.id} value={un.id}>
                            {lang === 'bn' ? `${un.bn_name} (${un.name})` : `${un.name} (${un.bn_name})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Postal Zip */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                      {t.zipLabel}
                    </label>
                    <input
                      type="text"
                      value={presentZip}
                      onChange={(e) => setPresentZip(e.target.value)}
                      placeholder="e.g. 1212"
                      style={{
                        width: '100%',
                        maxWidth: '240px',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* PERMANENT ADDRESS CONTAINER */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '22px',
                  marginBottom: '32px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--accent-green-light)' }}>
                      {t.permanentAddressHeader}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={sameAsPresent}
                        onChange={(e) => setSameAsPresent(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                      />
                      <span>{t.sameAsPresentLabel}</span>
                    </label>
                  </div>

                  {!sameAsPresent ? (
                    <div>
                      {/* Permanent Street */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                          {t.permanentStreetLabel}
                        </label>
                        <input
                          type="text"
                          value={permanentStreet}
                          onChange={(e) => setPermanentStreet(e.target.value)}
                          placeholder="Permanent address details"
                          required={!sameAsPresent}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '13.5px',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Division & District */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                            {t.permanentDivisionLabel}
                          </label>
                          <select
                            className="select-input"
                            value={permanentDivisionId}
                            onChange={(e) => setPermanentDivisionId(e.target.value)}
                            required={!sameAsPresent}
                            style={{ width: '100%' }}
                          >
                            <option value="">{t.selectDivision}</option>
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {lang === 'bn' ? `${d.bn_name} (${d.name})` : `${d.name} (${d.bn_name})`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                            {t.permanentDistrictLabel}
                          </label>
                          <select
                            className="select-input"
                            value={permanentDistrictId}
                            onChange={(e) => setPermanentDistrictId(e.target.value)}
                            disabled={!permanentDivisionId}
                            required={!sameAsPresent}
                            style={{ width: '100%' }}
                          >
                            <option value="">{t.selectDistrict}</option>
                            {permanentDistricts.map((dst) => (
                              <option key={dst.id} value={dst.id}>
                                {lang === 'bn' ? `${dst.bn_name} (${dst.name})` : `${dst.name} (${dst.bn_name})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Upazila & Union */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                            {t.permanentUpazilaLabel}
                          </label>
                          <select
                            className="select-input"
                            value={permanentUpazilaId}
                            onChange={(e) => setPermanentUpazilaId(e.target.value)}
                            disabled={!permanentDistrictId}
                            style={{ width: '100%' }}
                          >
                            <option value="">{t.selectUpazila}</option>
                            {permanentUpazilas.map((u) => (
                              <option key={u.id} value={u.id}>
                                {lang === 'bn' ? `${u.bn_name} (${u.name})` : `${u.name} (${u.bn_name})`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                            {t.permanentUnionLabel}
                          </label>
                          <select
                            className="select-input"
                            value={permanentUnionId}
                            onChange={(e) => setPermanentUnionId(e.target.value)}
                            disabled={!permanentUpazilaId}
                            style={{ width: '100%' }}
                          >
                            <option value="">{t.selectUnion}</option>
                            {permanentUnions.map((un) => (
                              <option key={un.id} value={un.id}>
                                {lang === 'bn' ? `${un.bn_name} (${un.name})` : `${un.name} (${un.bn_name})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Permanent Zip */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>
                          {t.permanentZipLabel}
                        </label>
                        <input
                          type="text"
                          value={permanentZip}
                          onChange={(e) => setPermanentZip(e.target.value)}
                          placeholder="e.g. 1200"
                          style={{
                            width: '100%',
                            maxWidth: '240px',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '13.5px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '14px',
                      background: 'var(--bg-surface)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {t.syncedNotice}
                    </div>
                  )}
                </div>

                {/* Final Submit & Back Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {t.backStep2}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading ? 'var(--border-strong)' : 'var(--accent-green)',
                      color: '#FFFFFF',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    {loading ? t.submittingBtn : t.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Image Crop & Rotate Modal */}
      <ImageEditorModal
        isOpen={editorOpen}
        imageSrc={editingImageSrc}
        title={editorTitle}
        aspectRatio={editorRatio}
        onConfirm={handleEditorConfirm}
        onCancel={() => setEditorOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
