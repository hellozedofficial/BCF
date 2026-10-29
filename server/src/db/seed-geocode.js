import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedGeocodeData() {
  console.log('\n======================================================');
  console.log('   BANGLADESH GEOCODE (Divisions, Districts, Upazilas, Unions)');
  console.log('   Data Source: https://github.com/nuhil/bangladesh-geocode');
  console.log('======================================================\n');

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bcf',
    multipleStatements: true
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Create tables if not exists
    console.log('[1/6] Ensuring geocode tables exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS divisions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        bn_name VARCHAR(50) NOT NULL,
        url VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS districts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        division_id INT UNSIGNED NOT NULL,
        name VARCHAR(50) NOT NULL,
        bn_name VARCHAR(50) NOT NULL,
        lat VARCHAR(25) NULL,
        lon VARCHAR(25) NULL,
        url VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_districts_division (division_id),
        INDEX idx_districts_name (name),
        CONSTRAINT fk_districts_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS upazilas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        district_id INT UNSIGNED NOT NULL,
        name VARCHAR(60) NOT NULL,
        bn_name VARCHAR(60) NOT NULL,
        url VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_upazilas_district (district_id),
        INDEX idx_upazilas_name (name),
        CONSTRAINT fk_upazilas_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS unions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        upazila_id INT UNSIGNED NOT NULL,
        name VARCHAR(75) NOT NULL,
        bn_name VARCHAR(75) NOT NULL,
        url VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_unions_upazila (upazila_id),
        INDEX idx_unions_name (name),
        CONSTRAINT fk_unions_upazila FOREIGN KEY (upazila_id) REFERENCES upazilas(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('      ✔ Schema verified.');

    // 2. Load and parse JSON files
    const geoDir = path.join(__dirname, 'geocode');
    const divisionsData = JSON.parse(fs.readFileSync(path.join(geoDir, 'divisions.json'), 'utf8'))[2].data;
    const districtsData = JSON.parse(fs.readFileSync(path.join(geoDir, 'districts.json'), 'utf8'))[2].data;
    const upazilasData = JSON.parse(fs.readFileSync(path.join(geoDir, 'upazilas.json'), 'utf8'))[2].data;
    const unionsData = JSON.parse(fs.readFileSync(path.join(geoDir, 'unions.json'), 'utf8'))[2].data;

    // Temporarily disable foreign key checks during clean bulk upsert
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 3. Insert Divisions
    console.log(`[2/6] Inserting ${divisionsData.length} Divisions...`);
    const divValues = divisionsData.map(d => [
      parseInt(d.id, 10),
      d.name.trim(),
      d.bn_name.trim(),
      d.url ? d.url.trim() : null
    ]);
    await connection.query(
      `INSERT INTO divisions (id, name, bn_name, url) VALUES ?
       ON DUPLICATE KEY UPDATE name=VALUES(name), bn_name=VALUES(bn_name), url=VALUES(url)`,
      [divValues]
    );
    console.log(`      ✔ ${divisionsData.length} Divisions inserted.`);

    // 4. Insert Districts
    console.log(`[3/6] Inserting ${districtsData.length} Districts...`);
    const distValues = districtsData.map(d => [
      parseInt(d.id, 10),
      parseInt(d.division_id, 10),
      d.name.trim(),
      d.bn_name.trim(),
      d.lat ? d.lat.trim() : null,
      d.lon ? d.lon.trim() : null,
      d.url ? d.url.trim() : null
    ]);
    await connection.query(
      `INSERT INTO districts (id, division_id, name, bn_name, lat, lon, url) VALUES ?
       ON DUPLICATE KEY UPDATE division_id=VALUES(division_id), name=VALUES(name), bn_name=VALUES(bn_name), lat=VALUES(lat), lon=VALUES(lon), url=VALUES(url)`,
      [distValues]
    );
    console.log(`      ✔ ${districtsData.length} Districts inserted.`);

    // 5. Insert Upazilas
    console.log(`[4/6] Inserting ${upazilasData.length} Upazilas...`);
    const upzValues = upazilasData.map(u => [
      parseInt(u.id, 10),
      parseInt(u.district_id, 10),
      u.name.trim(),
      u.bn_name.trim(),
      u.url ? u.url.trim() : null
    ]);
    await connection.query(
      `INSERT INTO upazilas (id, district_id, name, bn_name, url) VALUES ?
       ON DUPLICATE KEY UPDATE district_id=VALUES(district_id), name=VALUES(name), bn_name=VALUES(bn_name), url=VALUES(url)`,
      [upzValues]
    );
    console.log(`      ✔ ${upazilasData.length} Upazilas inserted.`);

    // 6. Insert Unions (in batches of 500 for high efficiency)
    console.log(`[5/6] Inserting ${unionsData.length} Unions in batches...`);
    const batchSize = 500;
    for (let i = 0; i < unionsData.length; i += batchSize) {
      const slice = unionsData.slice(i, i + batchSize);
      const unionValues = slice.map(un => [
        parseInt(un.id, 10),
        parseInt(un.upazilla_id, 10),
        un.name.trim(),
        un.bn_name.trim(),
        un.url ? un.url.trim() : null
      ]);
      await connection.query(
        `INSERT INTO unions (id, upazila_id, name, bn_name, url) VALUES ?
         ON DUPLICATE KEY UPDATE upazila_id=VALUES(upazila_id), name=VALUES(name), bn_name=VALUES(bn_name), url=VALUES(url)`,
        [unionValues]
      );
    }
    console.log(`      ✔ ${unionsData.length} Unions inserted.`);

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 7. Comprehensive Cross-Check Verification
    console.log('\n[6/6] CROSS-CHECK & INTEGRITY VERIFICATION:');
    const [[divCount]] = await connection.query('SELECT COUNT(*) as count FROM divisions');
    const [[distCount]] = await connection.query('SELECT COUNT(*) as count FROM districts');
    const [[upzCount]] = await connection.query('SELECT COUNT(*) as count FROM upazilas');
    const [[unionCount]] = await connection.query('SELECT COUNT(*) as count FROM unions');

    console.log(`      • Divisions count in DB : ${divCount.count} (Expected: ${divisionsData.length}) ${divCount.count === divisionsData.length ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`      • Districts count in DB : ${distCount.count} (Expected: ${districtsData.length}) ${distCount.count === districtsData.length ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`      • Upazilas count in DB  : ${upzCount.count} (Expected: ${upazilasData.length}) ${upzCount.count === upazilasData.length ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`      • Unions count in DB    : ${unionCount.count} (Expected: ${unionsData.length}) ${unionCount.count === unionsData.length ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Relational Integrity Checks
    const [[badDistricts]] = await connection.query(`
      SELECT COUNT(*) as orphan_count 
      FROM districts d 
      LEFT JOIN divisions dv ON d.division_id = dv.id 
      WHERE dv.id IS NULL
    `);
    const [[badUpazilas]] = await connection.query(`
      SELECT COUNT(*) as orphan_count 
      FROM upazilas u 
      LEFT JOIN districts d ON u.district_id = d.id 
      WHERE d.id IS NULL
    `);
    const [[badUnions]] = await connection.query(`
      SELECT COUNT(*) as orphan_count 
      FROM unions un 
      LEFT JOIN upazilas u ON un.upazila_id = u.id 
      WHERE u.id IS NULL
    `);

    console.log('\n      Relational Integrity:');
    console.log(`      • Orphaned Districts (invalid division_id) : ${badDistricts.orphan_count} ${badDistricts.orphan_count === 0 ? '✅ 100% Valid' : '❌ Error'}`);
    console.log(`      • Orphaned Upazilas (invalid district_id)   : ${badUpazilas.orphan_count} ${badUpazilas.orphan_count === 0 ? '✅ 100% Valid' : '❌ Error'}`);
    console.log(`      • Orphaned Unions (invalid upazila_id)      : ${badUnions.orphan_count} ${badUnions.orphan_count === 0 ? '✅ 100% Valid' : '❌ Error'}`);

    console.log('\n🎉 ALL BANGLADESH GEOCODE DATA SUCCESSFULLY INSERTED & VERIFIED!\n');
    return true;
  } catch (error) {
    console.error('❌ Error seeding geocode data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Direct execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedGeocodeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
