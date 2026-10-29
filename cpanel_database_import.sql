-- Bangladesh Carrom Federation (BCF) cPanel Database Import
-- Ready for phpMyAdmin / cPanel MySQL Import
-- Character Set: utf8mb4

SET FOREIGN_KEY_CHECKS = 0;

-- Bangladesh Carrom Federation (BCF) Database Schema

-- 1. Clubs Table
CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  district VARCHAR(60) NOT NULL,
  president VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(30),
  established_year INT,
  total_registered_players INT DEFAULT 0,
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
  district VARCHAR(60),
  national_rank INT,
  rating_points INT DEFAULT 1200,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  white_slams INT DEFAULT 0,
  black_slams INT DEFAULT 0,
  photo_url VARCHAR(255) NULL,
  registration_id INT NULL,
  status ENUM('Active', 'Retired', 'Suspended') DEFAULT 'Active',
  phone VARCHAR(25),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_player_id (player_id)
);

-- 3. Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  edition VARCHAR(50),
  venue VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category VARCHAR(60) DEFAULT 'National Championship',
  prize_pool VARCHAR(60),
  registration_deadline DATE,
  status ENUM('Upcoming', 'Ongoing', 'Completed') DEFAULT 'Upcoming',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT,
  round_name VARCHAR(60) DEFAULT 'Group Stage',
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
  scheduled_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 5. News & Announcements Table
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category ENUM('Announcement', 'Tournament', 'Selection', 'Federation Notice', 'Press Release') DEFAULT 'Announcement',
  content TEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'BCF Media Cell',
  publish_date DATE DEFAULT (CURRENT_DATE),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Executive Committee Table
CREATE TABLE IF NOT EXISTS committee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  organization VARCHAR(100) DEFAULT 'Bangladesh Carrom Federation',
  contact_email VARCHAR(100),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  role VARCHAR(50) DEFAULT 'Super Admin',
  status ENUM('Active', 'Suspended') DEFAULT 'Active',
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Dumping data for table admin_users
INSERT INTO `admin_users` (`id`, `email`, `password_hash`, `name`, `role`, `status`, `last_login`, `created_at`) VALUES (1, 'hello@hellozed.com', 'f2cf2bb1128ca824a3aa5837c67e1b57:595a0be03f8faf2d36035e2f5752ddd30eb1ae05ae108705310c235e5a57e7ae8a788bd510a5e8d160418fdb97e848889ff9f6774ce7257a965a662a4464b81f', 'BCF Super Admin', 'Super Admin', 'Active', '2026-10-16 12:38:19', '2026-10-16 08:11:04');

-- Dumping data for table clubs
INSERT INTO `clubs` (`id`, `name`, `district`, `president`, `contact_email`, `contact_phone`, `established_year`, `total_registered_players`, `created_at`) VALUES (1, 'Dhaka Carrom Club', 'Dhaka', 'Ashraful Alam', 'dhaka.carrom@bcf.org.bd', '+880 1711-000111', 2004, 38, '2026-10-02 16:01:39');
INSERT INTO `clubs` (`id`, `name`, `district`, `president`, `contact_email`, `contact_phone`, `established_year`, `total_registered_players`, `created_at`) VALUES (2, 'Chittagong Striker Association', 'Chittagong', 'Mahfuzur Rahman', 'ctg.carrom@bcf.org.bd', '+880 1819-222333', 2008, 26, '2026-10-02 16:01:39');
INSERT INTO `clubs` (`id`, `name`, `district`, `president`, `contact_email`, `contact_phone`, `established_year`, `total_registered_players`, `created_at`) VALUES (3, 'Sylhet Royal Carrom Academy', 'Sylhet', 'Kamal Hossain', 'sylhet.carrom@bcf.org.bd', '+880 1712-333444', 2012, 19, '2026-10-02 16:01:39');
INSERT INTO `clubs` (`id`, `name`, `district`, `president`, `contact_email`, `contact_phone`, `established_year`, `total_registered_players`, `created_at`) VALUES (4, 'Khulna Carrom Guild', 'Khulna', 'Sheikh Tanvir', 'khulna.carrom@bcf.org.bd', '+880 1911-555666', 2015, 22, '2026-10-02 16:01:39');
INSERT INTO `clubs` (`id`, `name`, `district`, `president`, `contact_email`, `contact_phone`, `established_year`, `total_registered_players`, `created_at`) VALUES (5, 'Rajshahi Pioneer Carrom Club', 'Rajshahi', 'Dr. Enamul Haque', 'rajshahi.carrom@bcf.org.bd', '+880 1713-777888', 2016, 17, '2026-10-02 16:01:39');

-- Dumping data for table committee
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (1, 'Mohammad Ali Reza', 'President', 'Bangladesh Carrom Federation', 'president@bcf.org.bd', 1, '2026-10-02 16:01:39');
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (2, 'Ashrafuzzaman Khan', 'General Secretary', 'Bangladesh Carrom Federation', 'general.secretary@bcf.org.bd', 2, '2026-10-02 16:01:39');
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (3, 'Kazi Masudul Hassan', 'Vice President', 'Bangladesh Carrom Federation', 'vp1@bcf.org.bd', 3, '2026-10-02 16:01:39');
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (4, 'Begum Nurunnahar', 'Vice President (Women Division)', 'Bangladesh Carrom Federation', 'vp2@bcf.org.bd', 4, '2026-10-02 16:01:39');
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (5, 'Tanvir Ahmed Chowdhury', 'Treasurer', 'Bangladesh Carrom Federation', 'treasurer@bcf.org.bd', 5, '2026-10-02 16:01:39');
INSERT INTO `committee` (`id`, `name`, `designation`, `organization`, `contact_email`, `display_order`, `created_at`) VALUES (6, 'Farid Uddin Ahmed', 'Chairman, Tournament Committee', 'Bangladesh Carrom Federation', 'tournaments@bcf.org.bd', 6, '2026-10-02 16:01:39');

-- Dumping data for table tournaments
INSERT INTO `tournaments` (`id`, `title`, `edition`, `venue`, `start_date`, `end_date`, `category`, `prize_pool`, `registration_deadline`, `status`, `description`, `created_at`) VALUES (1, 'Bangladesh National Carrom Championship', '42nd Edition', 'National Sports Council (NSC) Gymnasium, Dhaka', '2026-11-09 18:00:00', '2026-11-14 18:00:00', 'National Championship', 'BDT 5,00,000', '2026-10-31 18:00:00', 'Upcoming', 'The premier annual national tournament featuring top players from all 64 districts of Bangladesh competing for national glory.', '2026-10-02 16:01:39');
INSERT INTO `tournaments` (`id`, `title`, `edition`, `venue`, `start_date`, `end_date`, `category`, `prize_pool`, `registration_deadline`, `status`, `description`, `created_at`) VALUES (2, 'BCF Premier Carrom League', 'Season 5', 'Mirpur Indoor Stadium, Dhaka', '2026-10-14 18:00:00', '2026-10-21 18:00:00', 'Premier League', 'BDT 3,50,000', '2026-10-07 18:00:00', 'Upcoming', 'Inter-club franchised carrom league with men and women singles, doubles, and mixed-pair categories.', '2026-10-02 16:01:39');
INSERT INTO `tournaments` (`id`, `title`, `edition`, `venue`, `start_date`, `end_date`, `category`, `prize_pool`, `registration_deadline`, `status`, `description`, `created_at`) VALUES (3, 'Federation Cup Carrom Open', '2026', 'Sylhet District Sports Complex', '2026-08-31 18:00:00', '2026-09-04 18:00:00', 'Open Tournament', 'BDT 2,00,000', '2026-08-24 18:00:00', 'Completed', 'Annual open tournament won by Hafizur Rahman in singles and Dhaka Club in doubles category.', '2026-10-02 16:01:39');

-- Dumping data for table players
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (1, NULL, 'Hafizur Rahman', NULL, 'Men', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 1, 1850, 68, 59, 14, 9, 'Active', '+880 1711-123456', 'hafiz.carrom@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (2, NULL, 'Hemayet Uddin', NULL, 'Men', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 2, 1810, 62, 53, 11, 7, 'Active', '+880 1712-234567', 'hemayet.uddin@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (3, NULL, 'Afsana Nasrin', NULL, 'Women', 'Senior', 'Chittagong Striker Association', 'Chittagong', 1, 1780, 54, 46, 8, 5, 'Active', '+880 1819-345678', 'afsana.carrom@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (4, NULL, 'Robiul Islam', NULL, 'Men', 'Senior', 'Khulna Carrom Guild', 'Khulna', 3, 1740, 58, 47, 9, 6, 'Active', '+880 1911-456789', 'robiul.carrom@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (5, NULL, 'Farhana Khanom', NULL, 'Women', 'Senior', 'Dhaka Carrom Club', 'Dhaka', 2, 1710, 48, 39, 6, 4, 'Active', '+880 1714-567890', 'farhana.k@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (6, NULL, 'Shakil Ahmed', NULL, 'Men', 'Junior', 'Sylhet Royal Carrom Academy', 'Sylhet', 4, 1690, 45, 36, 5, 4, 'Active', '+880 1715-678901', 'shakil.ahmed@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (7, NULL, 'Tariqul Islam', NULL, 'Men', 'Senior', 'Rajshahi Pioneer Carrom Club', 'Rajshahi', 5, 1665, 50, 38, 7, 3, 'Active', '+880 1716-789012', 'tariqul.bcf@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (8, NULL, 'Sabina Yasmin', NULL, 'Women', 'Senior', 'Khulna Carrom Guild', 'Khulna', 3, 1640, 42, 33, 4, 3, 'Active', '+880 1912-890123', 'sabina.y@gmail.com', '2026-10-02 16:01:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (13, NULL, 'MD. RASHED MIA', NULL, 'Men', 'Veteran', 'Independent', 'Habiganj', NULL, 1200, 0, 0, 0, 0, 'Active', '01934758395', 'hello@hellozed.com', '2026-10-13 11:47:39', NULL, NULL);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (16, 'BCF2026100002', 'MD MAMUN HASAN EMON', 'Emon', 'Men', 'Senior', 'Independent', 'Gazipur', NULL, 1200, 0, 0, 0, 0, 'Active', '01303997358', 'emon2072h@gmail.com', '2026-10-16 09:48:45', '/uploads/players/photos/photo_BCF2026100002_1792144050801_6cccc.jpg', 10);
INSERT INTO `players` (`id`, `player_id`, `full_name`, `nickname`, `gender`, `category`, `club_name`, `district`, `national_rank`, `rating_points`, `matches_played`, `matches_won`, `white_slams`, `black_slams`, `status`, `phone`, `email`, `created_at`, `photo_url`, `registration_id`) VALUES (17, 'BCF2026100001', 'Tanvir Ahmed Updated', 'Tanvir Bhai', 'Men', 'Senior', 'Independent', 'Dhaka', NULL, 1200, 0, 0, 0, 0, 'Active', '01711998877', 'tanvir.updated@bcf.org', '2026-10-16 10:05:55', '/uploads/players/photos/photo_BCF2026100001_1792142139974_4wh8l.jpg', 9);

-- Dumping data for table matches
INSERT INTO `matches` (`id`, `tournament_id`, `round_name`, `player1_id`, `player2_id`, `player1_name`, `player2_name`, `player1_score`, `player2_score`, `boards_played`, `current_board`, `winner_id`, `status`, `scheduled_at`, `created_at`) VALUES (3, 2, 'Semi Final 1', NULL, NULL, 'Winner QF1', 'Winner QF2', 6, 6, 4, 4, NULL, 'Live', '2026-10-03 10:00:00', '2026-10-02 16:01:39');
INSERT INTO `matches` (`id`, `tournament_id`, `round_name`, `player1_id`, `player2_id`, `player1_name`, `player2_name`, `player1_score`, `player2_score`, `boards_played`, `current_board`, `winner_id`, `status`, `scheduled_at`, `created_at`) VALUES (4, 3, 'Final', NULL, NULL, 'Hafizur Rahman', 'Hemayet Uddin', 0, 18, 11, 8, NULL, 'Live', '2026-09-05 12:00:00', '2026-10-02 16:01:39');

-- Dumping data for table news
INSERT INTO `news` (`id`, `title`, `category`, `content`, `author`, `publish_date`, `is_pinned`, `created_at`) VALUES (1, 'Official Notice: 42nd Bangladesh National Carrom Championship Dates Finalized', 'Tournament', 'The executive committee of the Bangladesh Carrom Federation (BCF) has announced the official dates for the 42nd National Championship at the NSC Gymnasium Dhaka. Player registrations are open via the official portal.', 'BCF General Secretary', '2026-10-01 18:00:00', 1, '2026-10-02 16:01:39');
INSERT INTO `news` (`id`, `title`, `category`, `content`, `author`, `publish_date`, `is_pinned`, `created_at`) VALUES (2, 'National Carrom Squad Training Camp Initiated for 9th World Carrom Championship', 'Selection', 'A 12-member national preliminary squad has commenced intensive training at the BCF training center under head coach supervision for international competition.', 'BCF Media Cell', '2026-10-01 18:00:00', 1, '2026-10-02 16:01:39');
INSERT INTO `news` (`id`, `title`, `category`, `content`, `author`, `publish_date`, `is_pinned`, `created_at`) VALUES (3, 'BCF Player Registration Portal Launched for All Affiliated District Clubs', 'Announcement', 'Carrom players from all division and district leagues can now submit their federated player profiles directly online to receive certified BCF digital ranking IDs.', 'BCF IT Committee', '2026-10-01 18:00:00', 0, '2026-10-02 16:01:39');

SET FOREIGN_KEY_CHECKS = 1;
