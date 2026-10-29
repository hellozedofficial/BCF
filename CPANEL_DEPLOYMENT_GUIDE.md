# 🚀 বাংলাদেশ ক্যারম ফেডারেশন (BCF) - সম্পূর্ণ cPanel হোস্টিং ও ডিপ্লয়মেন্ট গাইড
### Official Domain: `https://bcf.org.bd`

বাংলাদেশ ক্যারম ফেডারেশনের অফিসিয়াল পোর্টালটি cPanel-এ ডিপ্লয় করার জন্য সম্পূর্ণ প্রস্তুত করা হয়েছে।

---

## 📑 সূচিপত্র
1. [স্থাপত্য ও ডোমেন কাঠামো](#১-স্থাপত্য-ও-ডোমেন-কাঠামো)
2. [এনভায়রনমেন্ট ভেরিয়েবল (.env)](#২-এনভায়রনমেন্ট-ভেরিয়েবল-env)
3. [ডাটাবেস সেটআপ (cPanel MySQL ও phpMyAdmin)](#৩-ডাটাবেস-সেটআপ-cpanel-mysql-ও-phpmyadmin)
4. [সহজ ১-ক্লিক ডিপ্লয়মেন্ট বান্ডেল তৈরি](#৪-সহজ-১-ক্লিক-ডিপ্লয়মেন্ট-বান্ডেল-তৈরি)
5. [cPanel-এ ফাইল আপলোড ও এক্সট্র্যাক্ট](#৫-cpanel-এ-ফাইল-আপলোড-ও-এক্সট্র্যাক্ট)
6. [Node.js ব্যাকএন্ড অ্যাপ চালু করা (cPanel "Setup Node.js App")](#৬-nodejs-ব্যাকএন্ড-অ্যাপ-চালু-করা)
7. [রানটাইম কনফিগারেশন (config.js)](#৭-রানটাইম-কনফিগারেশন-configjs)
8. [ফাইল পারমিশন ও আপলোড ফোল্ডার](#৮-ফাইল-পারমিশন-ও-আপলোড-ফোল্ডার)
9. [ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল ও লগইন](#৯-ডিফল্ট-অ্যাডমিন-ক্রেডেনশিয়াল-ও-লগইন)
10. [সাধারণ সমস্যা ও সমাধান (Troubleshooting)](#১০-সাধারণ-সমস্যা-ও-সমাধান)

---

## ১. স্থাপত্য ও ডোমেন কাঠামো

আপনার cPanel-এ `bcf.org.bd` ডোমেনের জন্য দুটি সুবিধাজনক পদ্ধতি রয়েছে:

### পদ্ধতি ক (সর্বাধিক জনপ্রিয় ও সহজ - Unified Domain):
- 🌐 **মূল ক্লায়েন্ট ওয়েবসাইট**: `https://bcf.org.bd` (ডকুমেন্ট রুট: `public_html/`)
- 🛡️ **অ্যাডমিন প্যানেল**: `https://bcf.org.bd/admin` (ফোল্ডার: `public_html/admin/`)
- ⚡ **ব্যাকএন্ড API**: `https://bcf.org.bd/api`
- 🖼️ **মিডিয়া ও ডকুমেন্টস**: `https://bcf.org.bd/uploads/`

### পদ্ধতি খ (সাবডোমেন ভিত্তিক):
- 🌐 **ক্লায়েন্ট ওয়েবসাইট**: `https://bcf.org.bd`
- 🛡️ **অ্যাডমিন প্যানেল**: `https://admin.bcf.org.bd`
- ⚡ **ব্যাকএন্ড API**: `https://api.bcf.org.bd`

*(প্রজেক্টের কোড এমনভাবে সাজানো হয়েছে যাতে পদ্ধতি ক অথবা খ — যেকোনোটিতেই স্বয়ংক্রিয়ভাবে কাজ করে)*

---

## ২. এনভায়রনমেন্ট ভেরিয়েবল (.env)

প্রজেক্টের ব্যাকএন্ডের জন্য `cpanel.env.example` ফাইল দেওয়া রয়েছে। cPanel-এ ব্যাকএন্ড ফোল্ডারে এটিকে `.env` নামে সেভ করুন:

```env
PORT=5050
NODE_ENV=production

# 🗄️ MySQL Database Credentials (cPanel-এ তৈরিকৃত)
DB_HOST=localhost
DB_PORT=3306
DB_USER=yourcpanel_bcfuser
DB_PASSWORD=your_mysql_password
DB_NAME=yourcpanel_bcf

# 🌐 Production URLs
CLIENT_URL=https://bcf.org.bd
ADMIN_URL=https://bcf.org.bd/admin
API_URL=https://bcf.org.bd/api
SERVER_URL=https://bcf.org.bd

# 🎨 Theme Primary Color (BCF Official Green)
PRIMARY_COLOR=#84b701

# 📂 Admin Base Route
ADMIN_BASE_PATH=/admin/

# 📧 SMTP ইমেইল কনফিগারেশন (প্লেয়ার রেজিস্ট্রেশন ফরম ও নোটিফিকেশনের জন্য)
MAIL_HOST=mail.bcf.org.bd
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USERNAME=noreply@bcf.org.bd
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS=noreply@bcf.org.bd
MAIL_FROM_NAME="Bangladesh Carrom Federation"
MAIL_REPLY_TO=info@bcf.org.bd
```

---

## ৩. ডাটাবেস সেটআপ (cPanel MySQL ও phpMyAdmin)

1. cPanel ড্যাশবোর্ডে গিয়ে **"MySQL® Database Wizard"** ওপেন করুন।
2. নতুন ডাটাবেস তৈরি করুন (যেমন: `bcf`), ফুল নাম হবে `yourusername_bcf`।
3. একটি নতুন ডাটাবেস ইউজার ও শক্তিশালী পাসওয়ার্ড দিন।
4. **"ALL PRIVILEGES"** চেকবক্সে টিক দিয়ে **"Make Changes"** এ ক্লিক করুন।
5. cPanel থেকে **"phpMyAdmin"** ওপেন করুন এবং বাঁপাশের লিস্ট থেকে তৈরিকৃত ডাটাবেসটি সিলেক্ট করুন।
6. উপরের **"Import"** ট্যাবে যান।
7. প্রজেক্টের **`cpanel_database_import.sql`** ফাইলটি সিলেক্ট করে নিচে **"Go"** বাটনে ক্লিক করুন।
   *(এটি সফলভাবে সমস্ত টেবিল, স্কিমা এবং ডিফল্ট অ্যাডমিন ইউজার তৈরি করবে)*

---

## ৪. সহজ ১-ক্লিক ডিপ্লয়মেন্ট বান্ডেল তৈরি

আপনার লোকাল মেশিনের টার্মিনালে নিচের কমান্ডটি রান করুন:

```bash
npm run build:cpanel
```

এই কমান্ডটি স্বয়ংক্রিয়ভাবে:
1. Client ও Admin প্রোডাকশন বিল্ড তৈরি করবে।
2. `cpanel_deploy/` ফোল্ডারে প্রস্তুতকৃত ফাইল সাজাবে।
3. সরাসরি আপলোডযোগ্য দুটি জিপ তৈরি করবে:
   - 📦 `cpanel_deploy/public_html.zip` (ফ্রন্টএন্ড এবং অ্যাডমিন)
   - 📦 `cpanel_deploy/backend_app.zip` (Node.js ব্যাকএন্ড অ্যাপ)

---

## ৫. cPanel-এ ফাইল আপলোড ও এক্সট্র্যাক্ট

### ফ্রন্টএন্ড ও অ্যাডমিন আপলোড:
1. cPanel **"File Manager"** এ যান।
2. **`public_html/`** ডিরেক্টরিতে যান।
3. উপরে **"Upload"** এ ক্লিক করে `cpanel_deploy/public_html.zip` ফাইলটি আপলোড করুন।
4. আপলোড শেষ হলে ফাইলটি সিলেক্ট করে **"Extract"** করুন।
5. নিশ্চিত করুন যে `.htaccess` ফাইলটি দৃশ্যমান রয়েছে। *(যদি না দেখা যায় তবে File Manager Settings থেকে "Show Hidden Files" চালু করুন)*।

---

## ৬. Node.js ব্যাকএন্ড অ্যাপ চালু করা

1. cPanel ড্যাশবোর্ডে **"Software"** সেকশন থেকে **"Setup Node.js App"** এ ক্লিক করুন।
2. **"Create Application"** বাটনে ক্লিক করুন:
   - **Node.js version**: `18.x` অথবা `20.x` সিলেক্ট করুন।
   - **Application mode**: `Production`
   - **Application root**: `backend_app`
   - **Application URL**: `bcf.org.bd` (অথবা আপনার API সাবডোমেন)
   - **Application startup file**: `app.js`
3. **"Create"** এ ক্লিক করুন।
4. File Manager দিয়ে `backend_app` ফোল্ডারে গিয়ে `cpanel_deploy/backend_app.zip` আপলোড করে **Extract** করুন।
5. সেখানে থাকা `.env.example` ফাইলটিকে রিনেম করে `.env` করুন এবং ডাটাবেসের সঠিক ইউজার, পাসওয়ার্ড ও নাম লিখে সেভ করুন।
6. পুনরায় **"Setup Node.js App"** পেজে ফিরে এসে:
   - **"Run NPM Install"** বাটনে ক্লিক করুন।
   - **"Restart"** বাটনে ক্লিক করুন!

এখন আপনার ব্যাকএন্ড সচল! ব্রাউজারে `https://bcf.org.bd/api/health` ওপেন করলে স্ট্যাটাস `ok` দেখতে পাবেন।

---

## ৭. রানটাইম কনফিগারেশন (config.js)

ভবিষ্যতে যদি কখনো API ডোমেন বা সার্ভার পাথ পরিবর্তন করতে চান, তবে পুনরায় পুরো React প্রজেক্ট বিল্ড দেওয়ার প্রয়োজন নেই!
- `public_html/config.js` (ক্লায়েন্টের জন্য)
- `public_html/admin/config.js` (অ্যাডমিনের জন্য)

এই ফাইলগুলোতে সাধারণ টেক্সট এডিটরে সরাসরি আপনার কাঙ্ক্ষিত ডোমেন বসিয়ে দিলেই সাথে সাথে কার্যকর হবে।

---

## ৮. ফাইল পারমিশন ও আপলোড ফোল্ডার

প্লেয়ারদের ছবি, এনআইডি এবং ক্লাব/টুর্নামেন্টের ব্যানার যেন নিরাপদে সেভ হতে পারে:
- `backend_app/server/uploads/` ফোল্ডারের পারমিশন File Manager-এ **755** রয়েছে কিনা নিশ্চিত করুন।

---

## ৯. ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল ও লগইন

- 🔗 **অ্যাডমিন লগইন URL**: `https://bcf.org.bd/admin/login` (অথবা `https://admin.bcf.org.bd/login`)
- 📧 **ইমেইল**: `hello@hellozed.com`
- 🔑 **পাসওয়ার্ড**: `12wq1234`

*(লগইন করার পর অ্যাডমিন ড্যাশবোর্ড থেকে পাসওয়ার্ড পরিবর্তন করে নেওয়া বাঞ্ছনীয়)*

---

## ১০. সাধারণ সমস্যা ও সমাধান (Troubleshooting)

| সমস্যা | সম্ভাব্য কারণ | সমাধান |
| :--- | :--- | :--- |
| **পেজ রিলোড দিলে 404 Not Found** | `.htaccess` আপলোড হয়নি বা লুকানো রয়েছে | File Manager Settings থেকে "Show Hidden Files" চালু করে নিশ্চিত হোন `public_html/.htaccess` এবং `public_html/admin/.htaccess` উভয়ই আছে। |
| **API রিকোয়েস্টে Network Error / 500** | ডাটাবেস সংযোগ ব্যর্থ | `backend_app/.env` ফাইলে ডাটাবেস ইউজার ও পাসওয়ার্ড সঠিক আছে কিনা এবং phpMyAdmin-এ ইউজারকে ALL PRIVILEGES দেওয়া আছে কিনা চেক করুন। |
| **অ্যাডমিন প্যানেল ব্ল্যাঙ্ক স্ক্রিন** | ব্রাউজারে ক্যাশ পুরনো ফাইল ধরা | `Ctrl + Shift + R` (Mac-এ `Cmd + Shift + R`) দিয়ে হার্ড রিফ্রেশ দিন। |
| **ছবি বা পিডিএফ জেনারেট হচ্ছে না** | Sharp / PDFKit ডিপেন্ডেন্সি মিসিং | cPanel Setup Node.js App-এ গিয়ে "Run NPM Install" দিন এবং অ্যাপ Restart করুন। |

---
**বাংলাদেশ ক্যারম ফেডারেশন (BCF)** • কারিগরি সহায়তায়: *hellozed*
