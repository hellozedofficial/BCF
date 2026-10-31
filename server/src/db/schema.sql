-- Bangladesh Carrom Federation (BCF) Database Schema

-- 1. Clubs Table
CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  division VARCHAR(100) NULL,
  division_id INT NULL,
  district VARCHAR(60) NOT NULL,
  district_id INT NULL,
  address TEXT NULL,
  president VARCHAR(100),
  president_phone VARCHAR(50),
  president_email VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(30),
  established_year INT,
  total_registered_players INT DEFAULT 0,
  logo_url VARCHAR(255) NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Players Table
CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(30) NULL,
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(100) NULL,
  gender ENUM('Men', 'Women') DEFAULT 'Men',
  category ENUM('Senior', 'Junior', 'Sub-Junior', 'Veteran') DEFAULT 'Senior',
  club_name VARCHAR(100),
  division VARCHAR(100) NULL,
  district VARCHAR(60),
  dominant_hand VARCHAR(30) DEFAULT 'Right Hand',
  playing_style VARCHAR(60) DEFAULT 'All-Rounder',
  carrom_board_preference VARCHAR(80) NULL,
  national_rank INT,
  rating_points INT DEFAULT 1200,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  white_slams INT DEFAULT 0,
  black_slams INT DEFAULT 0,
  photo_url VARCHAR(255) NULL,
  registration_id INT NULL,
  status ENUM('Active', 'Inactive', 'Retired', 'Suspended') DEFAULT 'Active',
  phone VARCHAR(25),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_player_id (player_id)
);

-- 3. Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_code VARCHAR(30) UNIQUE,
  title VARCHAR(150) NOT NULL,
  edition VARCHAR(50),
  venue VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category VARCHAR(60) DEFAULT 'National Championship',
  format ENUM('Knockout', 'RoundRobin') DEFAULT 'Knockout',
  seeding_type ENUM('Seeded', 'Random') DEFAULT 'Seeded',
  board_limit INT DEFAULT 8,
  points_limit INT DEFAULT 25,
  total_participants INT DEFAULT 0,
  prize_pool VARCHAR(60),
  registration_deadline DATE,
  status ENUM('Upcoming', 'Ongoing', 'Completed') DEFAULT 'Upcoming',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3b. Tournament Participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  player_id INT NOT NULL,
  seed_number INT DEFAULT 0,
  status ENUM('Registered', 'CheckedIn', 'Disqualified', 'Eliminated', 'Champion', 'RunnerUp') DEFAULT 'Registered',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tourney_player (tournament_id, player_id)
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT,
  round_name VARCHAR(60) DEFAULT 'Group Stage',
  board_number INT DEFAULT 1,
  match_order INT DEFAULT 1,
  round_level INT DEFAULT 1,
  next_match_id INT NULL,
  player1_id INT,
  player2_id INT,
  player1_name VARCHAR(100) NOT NULL,
  player2_name VARCHAR(100) NOT NULL,
  player1_score INT DEFAULT 0,
  player2_score INT DEFAULT 0,
  boards_played INT DEFAULT 0,
  current_board INT DEFAULT 1,
  winner_id INT NULL,
  status ENUM('Scheduled', 'Live', 'Completed') DEFAULT 'Scheduled',
  stream_url VARCHAR(255) NULL,
  scheduled_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 5. News & Blogs Table
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type ENUM('News', 'Blog') NOT NULL DEFAULT 'News',
  slug VARCHAR(255) UNIQUE NOT NULL,
  image_url TEXT NULL,
  summary TEXT NULL,
  category ENUM('Announcement', 'Tournament', 'Selection', 'Federation Notice', 'Press Release', 'Interview', 'Analysis', 'Editorial') DEFAULT 'Announcement',
  content LONGTEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'BCF Media Cell',
  publish_date DATE DEFAULT (CURRENT_DATE),
  is_pinned BOOLEAN DEFAULT FALSE,
  status ENUM('Published', 'Draft') NOT NULL DEFAULT 'Published',
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Executive Committee Table
CREATE TABLE IF NOT EXISTS committee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  organization VARCHAR(100) DEFAULT 'Bangladesh Carrom Federation',
  contact_email VARCHAR(100),
  phone VARCHAR(50),
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6b. CMS About Settings Table
CREATE TABLE IF NOT EXISTS cms_about (
  id INT PRIMARY KEY,
  badge VARCHAR(100) DEFAULT 'Official National Authority',
  headline VARCHAR(255) DEFAULT 'Governing Carrom Excellence Across Bangladesh',
  story_p1 TEXT,
  story_p2 TEXT,
  history_story TEXT,
  mission TEXT,
  vision TEXT,
  office_address VARCHAR(255) DEFAULT 'National Sports Council (NSC) Tower, 62/3 Purana Paltan, Dhaka-1000',
  official_colors VARCHAR(100) DEFAULT 'Bangladesh Bottle Green & Gold',
  bounce_images JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  district VARCHAR(60) NOT NULL,
  club_name VARCHAR(100),
  category VARCHAR(50) DEFAULT 'Senior Men',
  tournament_id INT NULL,
  notes TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 8. Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  bn_name VARCHAR(50) NOT NULL,
  url VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Districts Table
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

-- 10. Upazilas Table
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

-- 11. Unions Table
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

-- 12. Player Registrations Table
CREATE TABLE IF NOT EXISTS player_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  phone VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  player_since INT NOT NULL,
  is_new_player TINYINT(1) DEFAULT 0,
  name_en VARCHAR(120) NOT NULL,
  name_bn VARCHAR(120) NOT NULL,
  nickname VARCHAR(100),
  gender VARCHAR(20) DEFAULT 'Men',
  father_name VARCHAR(120),
  mother_name VARCHAR(120),
  dob VARCHAR(40),
  nid_number VARCHAR(60) NOT NULL,
  photo_url LONGTEXT,
  nid_front_url LONGTEXT,
  nid_back_url LONGTEXT,
  present_street VARCHAR(255),
  present_division_id INT UNSIGNED,
  present_district_id INT UNSIGNED,
  present_upazila_id INT UNSIGNED,
  present_union_id INT UNSIGNED,
  present_zip VARCHAR(20),
  permanent_street VARCHAR(255),
  permanent_division_id INT UNSIGNED,
  permanent_district_id INT UNSIGNED,
  permanent_upazila_id INT UNSIGNED,
  permanent_union_id INT UNSIGNED,
  permanent_zip VARCHAR(20),
  same_as_present TINYINT(1) DEFAULT 0,
  status ENUM('Pending', 'Approved', 'Rejected', 'Active', 'Suspended') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_player_id (player_id),
  INDEX idx_email (email),
  INDEX idx_nid (nid_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'BCF Admin',
  avatar_url LONGTEXT NULL,
  role VARCHAR(50) DEFAULT 'Super Admin',
  designation VARCHAR(100) NULL,
  position VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Banners Table (CMS)
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NULL,
  image_url LONGTEXT NOT NULL,
  link_url VARCHAR(255) NULL,
  order_num INT DEFAULT 0,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banner_status (status),
  INDEX idx_banner_order (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

