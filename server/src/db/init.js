import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log('[DB-INIT] Connecting to MySQL server to check/initialize database...');
  
  const dbName = process.env.DB_NAME || 'bcf';

  // Optional: Attempt database creation if running with root/privileged user
  try {
    const rootConn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[DB-INIT] Database \`${dbName}\` verified/created.`);
    await rootConn.end();
  } catch (err) {
    // On cPanel or restricted shared hosting, database is pre-created by the user in cPanel
    console.log(`[DB-INIT] Notice: Database pre-check skipped or pre-created: ${err.message}`);
  }

  // Connect to the specific database
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true
  });

  // Read and run schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);
  console.log('[DB-INIT] Schema tables verified/created.');

  // Ensure gender column in player_registrations exists
  try {
    await db.query("ALTER TABLE player_registrations ADD COLUMN gender VARCHAR(20) DEFAULT 'Men' AFTER nickname");
  } catch (err) {
    // Already exists
  }

  // Ensure clubs table columns exist
  try {
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS division VARCHAR(100) NULL AFTER name");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS division_id INT NULL AFTER division");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS district_id INT NULL AFTER district");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS address TEXT NULL AFTER district");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS president_phone VARCHAR(50) NULL AFTER president");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS president_email VARCHAR(100) NULL AFTER president_phone");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255) NULL AFTER total_registered_players");
    await db.query("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Inactive') DEFAULT 'Active' AFTER logo_url");
  } catch (err) {
    // Already exists
  }

  // Ensure players table columns exist
  try {
    await db.query("ALTER TABLE players ADD COLUMN IF NOT EXISTS division VARCHAR(100) NULL AFTER club_name");
    await db.query("ALTER TABLE players ADD COLUMN IF NOT EXISTS dominant_hand VARCHAR(30) DEFAULT 'Right Hand' AFTER district");
    await db.query("ALTER TABLE players ADD COLUMN IF NOT EXISTS playing_style VARCHAR(60) DEFAULT 'All-Rounder' AFTER dominant_hand");
    await db.query("ALTER TABLE players ADD COLUMN IF NOT EXISTS carrom_board_preference VARCHAR(80) NULL AFTER playing_style");
    await db.query("ALTER TABLE players MODIFY COLUMN status ENUM('Active', 'Inactive', 'Retired', 'Suspended') DEFAULT 'Active'");
  } catch (err) {
    // Already exists
  }

  // Ensure admin_users columns exist
  try {
    await db.query("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url LONGTEXT NULL AFTER name");
    await db.query("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS designation VARCHAR(100) NULL AFTER role");
    await db.query("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL AFTER designation");
    await db.query("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL AFTER position");
    await db.query("ALTER TABLE admin_users MODIFY COLUMN status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active'");
  } catch (err) {
    // Already exists
  }

  // Ensure system_settings table exists
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value LONGTEXT NULL,
        category VARCHAR(50) DEFAULT 'general',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    // Already exists
  }

  // Check if data already exists in players
  const [existingPlayers] = await db.query('SELECT COUNT(*) as count FROM players');
  if (existingPlayers[0].count === 0) {
    console.log('[DB-INIT] Seeding initial Bangladesh Carrom Federation data...');

    // 1. Seed Clubs
    await db.query(`
      INSERT INTO clubs (name, district, president, contact_email, contact_phone, established_year, total_registered_players) VALUES
      ('Dhaka Carrom Club', 'Dhaka', 'Ashraful Alam', 'dhaka.carrom@bcf.org.bd', '+880 1711-000111', 2004, 38),
      ('Chittagong Striker Association', 'Chittagong', 'Mahfuzur Rahman', 'ctg.carrom@bcf.org.bd', '+880 1819-222333', 2008, 26),
      ('Sylhet Royal Carrom Academy', 'Sylhet', 'Kamal Hossain', 'sylhet.carrom@bcf.org.bd', '+880 1712-333444', 2012, 19),
      ('Khulna Carrom Guild', 'Khulna', 'Sheikh Tanvir', 'khulna.carrom@bcf.org.bd', '+880 1911-555666', 2015, 22),
      ('Rajshahi Pioneer Carrom Club', 'Rajshahi', 'Dr. Enamul Haque', 'rajshahi.carrom@bcf.org.bd', '+880 1713-777888', 2016, 17);
    `);

    // 2. Seed Players
    await db.query(`
      INSERT INTO players (full_name, gender, category, club_name, district, national_rank, rating_points, matches_played, matches_won, white_slams, black_slams, status, phone, email) VALUES
      ('Hafizur Rahman', 'Men', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 1, 1850, 68, 59, 14, 9, 'Active', '+880 1711-123456', 'hafiz.carrom@gmail.com'),
      ('Hemayet Uddin', 'Men', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 2, 1810, 62, 53, 11, 7, 'Active', '+880 1712-234567', 'hemayet.uddin@gmail.com'),
      ('Afsana Nasrin', 'Women', 'Senior', 'Chittagong Striker Association', 'Chittagong', 1, 1780, 54, 46, 8, 5, 'Active', '+880 1819-345678', 'afsana.carrom@gmail.com'),
      ('Robiul Islam', 'Men', 'Senior', 'Khulna Carrom Guild', 'Khulna', 3, 1740, 58, 47, 9, 6, 'Active', '+880 1911-456789', 'robiul.carrom@gmail.com'),
      ('Farhana Khanom', 'Women', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 2, 1710, 48, 39, 6, 4, 'Active', '+880 1714-567890', 'farhana.k@gmail.com'),
      ('Shakil Ahmed', 'Men', 'Junior', 'Sylhet Royal Carrom Academy', 'Sylhet', 4, 1690, 45, 36, 5, 4, 'Active', '+880 1715-678901', 'shakil.ahmed@gmail.com'),
      ('Tariqul Islam', 'Men', 'Senior', 'Rajshahi Pioneer Carrom Club', 'Rajshahi', 5, 1665, 50, 38, 7, 3, 'Active', '+880 1716-789012', 'tariqul.bcf@gmail.com'),
      ('Sabina Yasmin', 'Women', 'Senior', 'Khulna Carrom Guild', 'Khulna', 3, 1640, 42, 33, 4, 3, 'Active', '+880 1912-890123', 'sabina.y@gmail.com');
    `);

    // 3. Seed Tournaments
    await db.query(`
      INSERT INTO tournaments (title, edition, venue, start_date, end_date, category, prize_pool, registration_deadline, status, description) VALUES
      ('Bangladesh National Carrom Championship', '42nd Edition', 'National Sports Council (NSC) Gymnasium, Dhaka', '2026-11-10', '2026-11-15', 'National Championship', 'BDT 5,00,000', '2026-11-01', 'Upcoming', 'The premier annual national tournament featuring top players from all 64 districts of Bangladesh competing for national glory.'),
      ('Bangabandhu BCF Premier Carrom League', 'Season 5', 'Mirpur Indoor Stadium, Dhaka', '2026-10-15', '2026-10-22', 'Premier League', 'BDT 3,50,000', '2026-10-08', 'Upcoming', 'Inter-club franchised carrom league with men and women singles, doubles, and mixed-pair categories.'),
      ('Federation Cup Carrom Open', '2026', 'Sylhet District Sports Complex', '2026-09-01', '2026-09-05', 'Open Tournament', 'BDT 2,00,000', '2026-08-25', 'Completed', 'Annual open tournament won by Hafizur Rahman in singles and Dhaka Club in doubles category.');
    `);

    // 4. Seed Matches
    await db.query(`
      INSERT INTO matches (tournament_id, round_name, player1_name, player2_name, player1_score, player2_score, boards_played, current_board, status, scheduled_at) VALUES
      (2, 'Quarter Final 1', 'Hafizur Rahman', 'Shakil Ahmed', 21, 14, 6, 7, 'Live', '2026-10-02 21:00:00'),
      (2, 'Quarter Final 2', 'Hemayet Uddin', 'Robiul Islam', 19, 17, 5, 6, 'Live', '2026-10-02 21:30:00'),
      (2, 'Semi Final 1', 'Winner QF1', 'Winner QF2', 0, 0, 0, 1, 'Scheduled', '2026-10-03 16:00:00'),
      (3, 'Final', 'Hafizur Rahman', 'Hemayet Uddin', 25, 18, 8, 8, 'Completed', '2026-09-05 18:00:00');
    `);

    // 5. Seed News
    await db.query(`
      INSERT INTO news (title, category, content, author, is_pinned) VALUES
      ('Official Notice: 42nd Bangladesh National Carrom Championship Dates Finalized', 'Tournament', 'The executive committee of the Bangladesh Carrom Federation (BCF) has announced the official dates for the 42nd National Championship at the NSC Gymnasium Dhaka. Player registrations are open via the official portal.', 'BCF General Secretary', TRUE),
      ('National Carrom Squad Training Camp Initiated for 9th World Carrom Championship', 'Selection', 'A 12-member national preliminary squad has commenced intensive training at the BCF training center under head coach supervision for international competition.', 'BCF Media Cell', TRUE),
      ('BCF Player Registration Portal Launched for All Affiliated District Clubs', 'Announcement', 'Carrom players from all division and district leagues can now submit their federated player profiles directly online to receive certified BCF digital ranking IDs.', 'BCF IT Committee', FALSE);
    `);

    // 6. Seed Committee
    await db.query(`
      INSERT INTO committee (name, designation, organization, contact_email, display_order) VALUES
      ('Mohammad Ali Reza', 'President', 'Bangladesh Carrom Federation', 'president@bcf.org.bd', 1),
      ('Ashrafuzzaman Khan', 'General Secretary', 'Bangladesh Carrom Federation', 'general.secretary@bcf.org.bd', 2),
      ('Kazi Masudul Hassan', 'Vice President', 'Bangladesh Carrom Federation', 'vp1@bcf.org.bd', 3),
      ('Begum Nurunnahar', 'Vice President (Women Division)', 'Bangladesh Carrom Federation', 'vp2@bcf.org.bd', 4),
      ('Tanvir Ahmed Chowdhury', 'Treasurer', 'Bangladesh Carrom Federation', 'treasurer@bcf.org.bd', 5),
      ('Farid Uddin Ahmed', 'Chairman, Tournament Committee', 'Bangladesh Carrom Federation', 'tournaments@bcf.org.bd', 6);
    `);

    console.log('[DB-INIT] Seeding completed successfully!');
  } else {
    console.log('[DB-INIT] Database already contains records. Skipping seed.');
  }

  // Ensure default Admin User exists
  try {
    const [adminUsers] = await db.query('SELECT id FROM admin_users WHERE email = ?', ['hello@hellozed.com']);
    if (adminUsers.length === 0) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('12wq1234', salt, 64).toString('hex');
      const defaultPasswordHash = `${salt}:${hash}`;

      await db.query(`
        INSERT INTO admin_users (email, password_hash, name, role, status)
        VALUES (?, ?, ?, ?, ?)
      `, ['hello@hellozed.com', defaultPasswordHash, 'BCF Super Admin', 'Super Admin', 'Active']);
      console.log('[DB-INIT] Initial admin user created: hello@hellozed.com');
    } else {
      console.log('[DB-INIT] Admin user hello@hellozed.com verified.');
    }
  } catch (adminErr) {
    console.error('[DB-INIT] Error seeding admin user:', adminErr.message);
  }

  // 14. Ensure Banners Seed Data
  try {
    const [existingBanners] = await db.query('SELECT COUNT(*) as count FROM banners');
    if (existingBanners[0].count === 0) {
      console.log('[DB-INIT] Seeding initial CMS hero banners...');
      await db.query(`
        INSERT INTO banners (title, subtitle, image_url, link_url, order_num, status) VALUES
        ('1st Executive Meeting 2026', 'Bangladesh Carrom Federation Executive Committee', 'https://scontent.fdac39-1.fna.fbcdn.net/v/t39.30808-6/795730795_122268866522146195_6889713579055724524_n.jpg?stp=cp6_dst-jpg_tt6&cstp=mx2048x1536&ctp=s2048x1536&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Lo9WJN22wtIQ7kNvwH2NQdq&_nc_oc=AdpjgwDGPKUeNMThAFyqcL4pILxkVXdhf9VrDSCeLbOJ5J8xev4FBybFd3GN1Xd3siQ&_nc_zt=23&_nc_ht=scontent.fdac39-1.fna&_nc_gid=HUR-7ChUqk37jy-ttSv6Xw&_nc_ss=7b2a8&oh=00_AQOiN9z1psW0bDnG1V0G3xsqKTL9NucdIUnUK9qn8varHQ&oe=6AD522F4', '/about', 1, 'Active'),
        ('BCF Premier Carrom League', '16 District Franchises Competing for the National Trophy', 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop', '/tournaments', 2, 'Active'),
        ('National Squad World Championship Training Camp', 'Precision & Elo Rating Camp with Master Strikers', 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop', '/players', 3, 'Active'),
        ('Grassroots Talent Identification & Youth Championship', 'Empowering junior carrom prodigies across 64 districts', 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop', '/clubs', 4, 'Active');
      `);
      console.log('[DB-INIT] CMS Banners seeded successfully.');
    } else {
      console.log('[DB-INIT] CMS Banners already exist.');
    }
  } catch (bannerErr) {
    console.error('[DB-INIT] Error seeding banners:', bannerErr.message);
  }

  // Ensure geocode data is populated if not yet seeded
  const [existingDivisions] = await db.query('SELECT COUNT(*) as count FROM divisions');
  if (existingDivisions[0].count === 0) {
    console.log('[DB-INIT] Geocode tables are empty. Seeding Bangladesh geocode dataset...');
    await db.end();
    const { seedGeocodeData } = await import('./seed-geocode.js');
    await seedGeocodeData();
  } else {
    console.log('[DB-INIT] Geocode data already populated. Skipping geocode seed.');
    await db.end();
  }

  console.log('[DB-INIT] Database initialization completed.');
}

// Run directly if called as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[DB-INIT] Error initializing database:', err);
      process.exit(1);
    });
}
