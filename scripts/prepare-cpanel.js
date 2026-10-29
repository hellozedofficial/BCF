import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const deployDir = path.join(rootDir, 'cpanel_deploy');
const publicHtmlDir = path.join(deployDir, 'public_html');
const backendAppDir = path.join(deployDir, 'backend_app');

console.log('🚀 [BCF Deploy] Preparing cPanel deployment bundle for bcf.org.bd...');

// Helper to copy recursively
function copyDirSync(src, dest, ignore = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, ignore);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and recreate cpanel_deploy
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(publicHtmlDir, { recursive: true });
fs.mkdirSync(backendAppDir, { recursive: true });

// 1. Copy Client dist to public_html/
const clientDist = path.join(rootDir, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  console.log('📦 Copying Client Portal to cpanel_deploy/public_html...');
  copyDirSync(clientDist, publicHtmlDir);
} else {
  console.error('❌ Error: client/dist not found. Run "npm run build:all" first.');
  process.exit(1);
}

// 2. Copy Admin dist to public_html/admin/
const adminDist = path.join(rootDir, 'admin', 'dist');
const adminDestDir = path.join(publicHtmlDir, 'admin');
if (fs.existsSync(adminDist)) {
  console.log('📦 Copying Admin Panel to cpanel_deploy/public_html/admin...');
  copyDirSync(adminDist, adminDestDir);
} else {
  console.error('❌ Error: admin/dist not found. Run "npm run build:all" first.');
  process.exit(1);
}

// 3. Assemble backend_app/
console.log('📦 Copying Node.js backend files to cpanel_deploy/backend_app...');
fs.copyFileSync(path.join(rootDir, 'app.js'), path.join(backendAppDir, 'app.js'));
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(backendAppDir, 'package.json'));
if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
  fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(backendAppDir, 'package-lock.json'));
}
fs.copyFileSync(path.join(rootDir, 'cpanel.env.example'), path.join(backendAppDir, '.env.example'));

// Copy server/ excluding node_modules, .env, and large cache
const serverSrc = path.join(rootDir, 'server');
const serverDest = path.join(backendAppDir, 'server');
copyDirSync(serverSrc, serverDest, ['node_modules', '.env', '.DS_Store']);

// 4. Copy Database Import SQL
console.log('🗄️ Copying database SQL to cpanel_deploy...');
fs.copyFileSync(
  path.join(rootDir, 'cpanel_database_import.sql'),
  path.join(deployDir, 'cpanel_database_import.sql')
);

// 5. Create quick start readme
const quickStart = `================================================================================
🇧🇩 BANGLADESH CARROM FEDERATION (BCF) - CPANEL DEPLOYMENT INSTRUCTIONS
Domain: https://bcf.org.bd
================================================================================

১. ডাটাবেস সেটআপ (phpMyAdmin):
   - cPanel -> "MySQL Database Wizard" এ গিয়ে ডাটাবেস ও ইউজার তৈরি করুন (ALL PRIVILEGES)।
   - phpMyAdmin ওপেন করে ডাটাবেস সিলেক্ট করুন এবং 'cpanel_database_import.sql' ফাইলটি Import করুন।
   - ডিফল্ট সুপার অ্যাডমিন ক্রেডেনশিয়াল:
     * Email: hello@hellozed.com
     * Password: 12wq1234

২. ব্যাকএন্ড Node.js অ্যাপ রান করা:
   - cPanel -> "Setup Node.js App" এ যান -> "Create Application" ক্লিক করুন।
   - Node.js version: 18.x অথবা 20.x
   - Application mode: Production
   - Application root: backend_app
   - Application startup file: app.js
   - Application URL: bcf.org.bd (অথবা api.bcf.org.bd)
   - 'backend_app.zip' ফাইলটি cPanel File Manager দিয়ে backend_app ফোল্ডারে আপলোড করে Extract করুন।
   - ফোল্ডারের '.env.example' ফাইলটি রিনেম করে '.env' করুন এবং ডাটাবেস ক্রেডেনশিয়াল বসিয়ে দিন।
   - "Setup Node.js App" পেজে এসে "Run NPM Install" দিন এবং "Restart" বাটনে ক্লিক করুন।

৩. ফ্রন্টএন্ড ও অ্যাডমিন প্যানেল আপলোড:
   - cPanel -> File Manager -> 'public_html' ফোল্ডারে যান।
   - 'public_html.zip' আপলোড করে Extract করুন।
   - এতে ক্লায়েন্ট ওয়েবসাইট (https://bcf.org.bd) এবং অ্যাডমিন প্যানেল (https://bcf.org.bd/admin) চালু হয়ে যাবে!

সরাসরি ব্রাউজ করুন:
- ওয়েবসাইট: https://bcf.org.bd
- অ্যাডমিন প্যানেল: https://bcf.org.bd/admin (বা https://admin.bcf.org.bd)
- ব্যাকএন্ড হেলথ চেক: https://bcf.org.bd/api/health
================================================================================`;

fs.writeFileSync(path.join(deployDir, 'QUICK_START.txt'), quickStart, 'utf8');

// 6. Zip files for 1-click cPanel upload
try {
  console.log('🗜️ Creating ZIP archives for easy 1-click cPanel upload...');
  execSync(`cd "${publicHtmlDir}" && zip -r -q "${path.join(deployDir, 'public_html.zip')}" .`);
  execSync(`cd "${backendAppDir}" && zip -r -q "${path.join(deployDir, 'backend_app.zip')}" .`);
  console.log('✅ Created: cpanel_deploy/public_html.zip');
  console.log('✅ Created: cpanel_deploy/backend_app.zip');
} catch (e) {
  console.warn('⚠️ Note: Zip command failed, but uncompressed cpanel_deploy folders are ready.');
}

console.log('🎉 [SUCCESS] Deployment bundle successfully created in: cpanel_deploy/');

