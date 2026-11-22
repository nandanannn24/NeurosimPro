import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function migrate() {
  console.log('Connecting to MySQL on 127.0.0.1:3306...');
  const rootConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  console.log('Creating database neurosim_db if not exists...');
  await rootConn.query(`
    CREATE DATABASE IF NOT EXISTS \`neurosim_db\`
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;
  `);
  await rootConn.end();

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'neurosim_db',
    multipleStatements: true,
  });

  console.log('Creating tables in neurosim_db...');

  // 1. Core tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`organizations\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(128) NOT NULL,
      \`slug\` VARCHAR(64) NOT NULL UNIQUE,
      \`logo_url\` VARCHAR(255) DEFAULT '/logo.webp',
      \`plan\` ENUM('starter', 'professional', 'enterprise') DEFAULT 'enterprise',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`roles\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(64) NOT NULL,
      \`slug\` VARCHAR(32) NOT NULL UNIQUE,
      \`description\` TEXT,
      \`level\` INT UNSIGNED DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`org_id\` INT UNSIGNED DEFAULT 1,
      \`role_id\` INT UNSIGNED DEFAULT 4,
      \`username\` VARCHAR(64) NOT NULL UNIQUE,
      \`email\` VARCHAR(128) NOT NULL UNIQUE,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`full_name\` VARCHAR(128) NOT NULL,
      \`title\` VARCHAR(100) DEFAULT 'Software Engineer',
      \`department\` VARCHAR(100) DEFAULT 'Product & Engineering',
      \`avatar\` VARCHAR(255) DEFAULT '/assets/characters/resident/standing/south.png',
      \`status\` ENUM('available', 'busy', 'dnd', 'meeting', 'away') DEFAULT 'available',
      \`is_active\` TINYINT(1) DEFAULT 1,
      \`reduce_motion\` TINYINT(1) DEFAULT 0,
      \`high_contrast\` TINYINT(1) DEFAULT 0,
      \`text_scale\` VARCHAR(20) DEFAULT 'normal',
      \`company_name\` VARCHAR(128) DEFAULT 'PT Inovasi Digital Nusantara',
      \`bracket_id\` VARCHAR(64) DEFAULT 'LOBBY-01',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_users_username\` (\`username\`),
      INDEX \`idx_users_email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`workspaces\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`org_id\` INT UNSIGNED NOT NULL DEFAULT 1,
      \`name\` VARCHAR(128) NOT NULL,
      \`description\` TEXT,
      \`is_default\` TINYINT(1) DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`office_rooms\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`workspace_id\` VARCHAR(64) NOT NULL DEFAULT 'ws-hq-main',
      \`code\` VARCHAR(32) NOT NULL UNIQUE,
      \`name\` VARCHAR(128) NOT NULL,
      \`type\` VARCHAR(64) DEFAULT 'main_office',
      \`description\` TEXT,
      \`zone\` VARCHAR(64) NOT NULL,
      \`spawn_x\` INT DEFAULT 1687,
      \`spawn_y\` INT DEFAULT 880,
      \`capacity\` INT DEFAULT 25,
      \`is_active\` TINYINT(1) DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`companies\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`name\` VARCHAR(128) NOT NULL,
      \`slug\` VARCHAR(64) NOT NULL UNIQUE,
      \`logo\` VARCHAR(255) DEFAULT '/logo.webp',
      \`assigned_bracket_id\` VARCHAR(64) NOT NULL,
      \`billing_key\` VARCHAR(64) NOT NULL,
      \`plan\` VARCHAR(32) DEFAULT 'enterprise_pro',
      \`status\` VARCHAR(32) DEFAULT 'active',
      \`valid_until\` VARCHAR(64) NOT NULL,
      \`humas_name\` VARCHAR(128) NOT NULL,
      \`humas_email\` VARCHAR(128) NOT NULL,
      \`humas_phone\` VARCHAR(64) NOT NULL,
      \`humas_title\` VARCHAR(128) NOT NULL,
      \`humas_notes\` TEXT,
      \`leader_name\` VARCHAR(128) DEFAULT 'Operations Lead',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`lobby_brackets\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`name\` VARCHAR(128) NOT NULL,
      \`company_name\` VARCHAR(128) NOT NULL,
      \`billing_key\` VARCHAR(64) NOT NULL,
      \`is_active\` TINYINT(1) DEFAULT 1,
      \`is_locked\` TINYINT(1) DEFAULT 0,
      \`max_capacity\` INT DEFAULT 20,
      \`online_count\` INT DEFAULT 0,
      \`server_region\` VARCHAR(64) DEFAULT 'ID-Jakarta-01',
      \`features_json\` JSON,
      \`humas_name\` VARCHAR(128),
      \`humas_email\` VARCHAR(128),
      \`humas_phone\` VARCHAR(64),
      \`humas_title\` VARCHAR(128),
      \`humas_notes\` TEXT,
      \`leader_name\` VARCHAR(128),
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`company_access_codes\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`code\` VARCHAR(64) NOT NULL UNIQUE,
      \`company_id\` VARCHAR(64) NOT NULL,
      \`company_name\` VARCHAR(128) NOT NULL,
      \`bracket_id\` VARCHAR(64) NOT NULL,
      \`room_name\` VARCHAR(128) NOT NULL,
      \`role\` ENUM('boss', 'humas', 'staff') NOT NULL,
      \`role_name\` VARCHAR(64) NOT NULL,
      \`is_active\` TINYINT(1) DEFAULT 1,
      \`used_count\` INT DEFAULT 0,
      \`max_uses\` INT DEFAULT NULL,
      \`expires_at\` VARCHAR(64) NOT NULL,
      \`created_by\` VARCHAR(128) DEFAULT 'Super Admin',
      \`notes\` TEXT,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`billing_sessions\` (
      \`id\` VARCHAR(64) PRIMARY KEY,
      \`company_name\` VARCHAR(128) NOT NULL,
      \`billing_key\` VARCHAR(64) NOT NULL UNIQUE,
      \`plan\` VARCHAR(32) DEFAULT 'enterprise_pro',
      \`max_seats_per_bracket\` INT DEFAULT 20,
      \`total_allocated_lobbies\` INT DEFAULT 1,
      \`status\` VARCHAR(32) DEFAULT 'active',
      \`valid_until\` VARCHAR(64) NOT NULL,
      \`contact_email\` VARCHAR(128) NOT NULL,
      \`assigned_lobbies_json\` JSON,
      \`humas_name\` VARCHAR(128),
      \`humas_email\` VARCHAR(128),
      \`humas_phone\` VARCHAR(64),
      \`notes\` TEXT,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`seat_occupancy\` (
      \`seat_id\` VARCHAR(64) PRIMARY KEY,
      \`bracket_id\` VARCHAR(64) NOT NULL,
      \`socket_id\` VARCHAR(64) DEFAULT NULL,
      \`user_id\` INT UNSIGNED DEFAULT NULL,
      \`username\` VARCHAR(64) DEFAULT NULL,
      \`full_name\` VARCHAR(128) DEFAULT NULL,
      \`avatar\` VARCHAR(255) DEFAULT NULL,
      \`role\` VARCHAR(64) DEFAULT NULL,
      \`occupied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`activity_logs\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`category\` VARCHAR(32) NOT NULL DEFAULT 'system',
      \`action\` VARCHAR(64) NOT NULL,
      \`actor\` VARCHAR(128) NOT NULL,
      \`details\` TEXT,
      \`ip_address\` VARCHAR(45) DEFAULT '127.0.0.1',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Seeding organizations & roles...');
  await conn.query(`
    INSERT INTO \`organizations\` (\`id\`, \`name\`, \`slug\`, \`plan\`) VALUES
    (1, 'NeuroSim Pro Enterprise Workspace', 'neurosim-pro-hq', 'enterprise')
    ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);

    INSERT INTO \`roles\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`level\`) VALUES
    (1, 'Super Administrator', 'super_admin', 'Full system management and global configurations', 100),
    (2, 'Organization Administrator', 'org_admin', 'Manages members, workspaces, rooms, and meetings', 80),
    (3, 'Manager / Team Leader', 'manager', 'Manages team meetings, breakout rooms, and agendas', 50),
    (4, 'Employee / Member', 'employee', 'Virtual office workspace, meetings, chat, and training', 20),
    (5, 'Guest / External Attendee', 'guest', 'Limited access to specific scheduled meetings', 10)
    ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);

    INSERT INTO \`workspaces\` (\`id\`, \`org_id\`, \`name\`, \`description\`, \`is_default\`) VALUES
    ('ws-hq-main', 1, 'Headquarters Virtual Campus', 'Main corporate workspace with full 2D interactive floor and conference suites.', 1)
    ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);
  `);

  console.log('Seeding users including admin Nandzzz (password: CobaBerhitung)...');
  const nandzzzHash = bcrypt.hashSync('CobaBerhitung', 10);
  const employeeHash = bcrypt.hashSync('employee123', 10);
  const leaderHash = bcrypt.hashSync('leader123', 10);
  const humasHash = bcrypt.hashSync('humas123', 10);

  // Insert or update admin Nandzzz
  await conn.query(`
    INSERT INTO \`users\` (\`id\`, \`org_id\`, \`role_id\`, \`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`title\`, \`department\`, \`avatar\`, \`company_name\`, \`bracket_id\`)
    VALUES
    (1, 1, 1, 'Nandzzz', 'nandzzz@neurosimpro.com', ?, 'Nandzzz (Super Administrator)', 'System Owner & Super Administrator', 'Executive Security Core', '/assets/characters/office-worker/standing/south.png', 'PT Inovasi Digital Nusantara', 'ALL')
    ON DUPLICATE KEY UPDATE
      \`username\`='Nandzzz',
      \`password_hash\`=VALUES(\`password_hash\`),
      \`role_id\`=1,
      \`full_name\`='Nandzzz (Super Administrator)',
      \`title\`='System Owner & Super Administrator';
  `, [nandzzzHash]);

  // Insert additional enterprise demo users
  await conn.query(`
    INSERT INTO \`users\` (\`id\`, \`org_id\`, \`role_id\`, \`username\`, \`email\`, \`password_hash\`, \`full_name\`, \`title\`, \`department\`, \`avatar\`, \`company_name\`, \`bracket_id\`)
    VALUES
    (2, 1, 3, 'leader', 'leader@neurosimpro.com', ?, 'Operations Lead (Bos Ruangan)', 'Engineering Manager & Leader', 'Divisi Kolaborasi & Delivery', '/assets/characters/resident/standing/south.png', 'PT Inovasi Digital Nusantara', 'LOBBY-01'),
    (3, 1, 2, 'humas', 'humas@inovasidigital.co.id', ?, 'Rina Wijaya, S.I.Kom', 'Head of Public Relations & Liaison', 'Hubungan Masyarakat & Eksternal', '/assets/characters/resident/standing/south.png', 'PT Inovasi Digital Nusantara', 'LOBBY-01'),
    (4, 1, 4, 'employee', 'employee@neurosimpro.com', ?, 'Staff Pengembang Internal', 'Frontend Engineer', 'Divisi Antarmuka & Frontend', '/assets/characters/resident/standing/south.png', 'PT Inovasi Digital Nusantara', 'LOBBY-01'),
    (5, 1, 5, 'guest', 'guest@neurosimpro.com', ?, 'Tamu Eksternal / Pengunjung', 'Guest Collaborator', 'External Stakeholder', '/assets/characters/courier/standing/south.png', 'NeuroSim Pro Open Campus', 'LOBBY-PUBLIC')
    ON DUPLICATE KEY UPDATE \`full_name\`=VALUES(\`full_name\`);
  `, [leaderHash, humasHash, employeeHash, employeeHash]);

  console.log('Seeding companies into MySQL...');
  await conn.query(`
    INSERT INTO \`companies\` (\`id\`, \`name\`, \`slug\`, \`assigned_bracket_id\`, \`billing_key\`, \`plan\`, \`status\`, \`valid_until\`, \`humas_name\`, \`humas_email\`, \`humas_phone\`, \`humas_title\`, \`humas_notes\`, \`leader_name\`)
    VALUES
    ('COMP-01', 'PT Inovasi Digital Nusantara', 'inovasi-digital', 'LOBBY-01', 'BILL-IDN-2026-HQ', 'enterprise_pro', 'active', '2026-12-31T23:59:59Z', 'Rina Wijaya, S.I.Kom', 'rina.wijaya@inovasidigital.co.id', '+62 812-8889-1001', 'Head of Public Relations & Liaison', 'Penghubung resmi PT Inovasi Digital Nusantara dengan platform NeuroSim Pro.', 'Operations Lead (Bos Ruangan)'),
    ('COMP-02', 'PT Nusantara Teknologi Mandiri', 'nusantara-tekno', 'LOBBY-02', 'BILL-NTM-8891-ENG', 'enterprise_pro', 'active', '2026-12-31T23:59:59Z', 'Dimas Pratama, M.T', 'dimas.pratama@nusantaratech.id', '+62 813-7722-4411', 'Lead AI & PR Coordinator', 'Penghubung komunikasi divisi engineering dan pengembangan AI.', 'Lead AI Engineer'),
    ('COMP-03', 'PT Kreatif Media Digital', 'kreatif-media', 'LOBBY-03', 'BILL-KMD-4521-PRD', 'business_growth', 'active', '2026-12-31T23:59:59Z', 'Sheila Amanda', 'sheila@kreatifmedia.com', '+62 811-9988-3322', 'Creative Director & Client Liaison', 'Penanggung jawab ruang studio visual dan kolaborasi klien luar.', 'Design Lead Director'),
    ('COMP-04', 'PT Solusi Awan Kolaborasi', 'solusi-awan', 'LOBBY-04', 'BILL-SAK-7712-REM', 'enterprise_pro', 'active', '2026-12-31T23:59:59Z', 'Fajar Nugroho', 'fajar@solusiawan.co.id', '+62 856-1122-3344', 'Remote Ops & Corporate Relation', 'Koordinator tim remote lintas pulau dan monitoring infrastruktur cloud.', 'Cloud Architect Host'),
    ('COMP-05', 'PT Ventura Kapital Asia', 'ventura-kapital', 'LOBBY-05', 'BILL-VKA-9900-EXEC', 'enterprise_pro', 'active', '2026-12-31T23:59:59Z', 'Amanda Valerie, B.Com', 'amanda@venturakapital.asia', '+62 812-9900-5566', 'Executive Associate & Partner Relations', 'Akses pimpinan eksekutif, investor relation, dan evaluasi portofolio bisnis.', 'Managing Partner')
    ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`humas_name\`=VALUES(\`humas_name\`);
  `);

  console.log('Seeding 5 server brackets + public lobby into MySQL...');
  await conn.query(`
    INSERT INTO \`lobby_brackets\` (\`id\`, \`name\`, \`company_name\`, \`billing_key\`, \`is_active\`, \`is_locked\`, \`max_capacity\`, \`online_count\`, \`server_region\`, \`features_json\`, \`humas_name\`, \`humas_email\`, \`humas_phone\`, \`humas_title\`, \`humas_notes\`, \`leader_name\`)
    VALUES
    ('LOBBY-PUBLIC', 'Public Lobby - Ruang Eksplorasi Tamu', 'NeuroSim Pro Open Campus', 'BILL-PUBLIC-GUEST', 1, 0, 50, 0, 'ID-JKT-OPEN', '{"videoConference": false, "screenShare": false, "breakoutRooms": false, "chatRealtime": true}', 'NeuroSim Community Guide', 'guide@neurosimpro.com', '+62 800-NEURO-SIM', 'Public Concierge & Assistant', 'Lobby publik gratis untuk mencoba pergerakan dan kustomisasi karakter.', 'Public Tour Host'),
    ('LOBBY-01', 'Bracket 01 - Kantor Pusat Utama', 'PT Inovasi Digital Nusantara', 'BILL-IDN-2026-HQ', 1, 0, 20, 1, 'ID-JKT-A1', '{"videoConference": true, "screenShare": true, "breakoutRooms": true, "chatRealtime": true}', 'Rina Wijaya, S.I.Kom', 'rina.wijaya@inovasidigital.co.id', '+62 812-8889-1001', 'Head of Public Relations & Liaison', 'Penghubung resmi PT Inovasi Digital Nusantara dengan Admin NeuroSim Pro.', 'Operations Lead (Manager)'),
    ('LOBBY-02', 'Bracket 02 - Divisi Engineering & AI', 'PT Nusantara Teknologi Mandiri', 'BILL-NTM-8891-ENG', 1, 0, 20, 0, 'ID-JKT-A2', '{"videoConference": true, "screenShare": true, "breakoutRooms": true, "chatRealtime": true}', 'Dimas Pratama, M.T', 'dimas.pratama@nusantaratech.id', '+62 813-7722-4411', 'Lead AI & PR Coordinator', 'Penghubung komunikasi divisi engineering dan pengembangan AI.', 'Lead AI Engineer'),
    ('LOBBY-03', 'Bracket 03 - Divisi Product & Design', 'PT Kreatif Media Digital', 'BILL-KMD-4521-PRD', 1, 0, 20, 0, 'ID-JKT-A3', '{"videoConference": true, "screenShare": true, "breakoutRooms": true, "chatRealtime": true}', 'Sheila Amanda', 'sheila@kreatifmedia.com', '+62 811-9988-3322', 'Creative Director & Client Liaison', 'Penanggung jawab ruang studio visual dan kolaborasi klien luar.', 'Design Lead Director'),
    ('LOBBY-04', 'Bracket 04 - Tim Remote Global', 'PT Solusi Awan Kolaborasi', 'BILL-SAK-7712-REM', 1, 0, 20, 0, 'ID-JKT-A4', '{"videoConference": true, "screenShare": true, "breakoutRooms": true, "chatRealtime": true}', 'Fajar Nugroho', 'fajar@solusiawan.co.id', '+62 856-1122-3344', 'Remote Ops & Corporate Relation', 'Koordinator tim remote lintas pulau dan monitoring infrastruktur cloud.', 'Cloud Architect Host'),
    ('LOBBY-05', 'Bracket 05 - Ruang Eksekutif & Klien', 'PT Ventura Kapital Asia', 'BILL-VKA-9900-EXEC', 1, 0, 20, 0, 'ID-JKT-A5', '{"videoConference": true, "screenShare": true, "breakoutRooms": true, "chatRealtime": true}', 'Amanda Valerie, B.Com', 'amanda@venturakapital.asia', '+62 812-9900-5566', 'Executive Associate & Partner Relations', 'Akses pimpinan eksekutif, investor relation, dan evaluasi portofolio bisnis.', 'Managing Partner')
    ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`company_name\`=VALUES(\`company_name\`);
  `);

  console.log('Seeding 15 role-based access codes into MySQL...');
  await conn.query(`
    INSERT INTO \`company_access_codes\` (\`id\`, \`code\`, \`company_id\`, \`company_name\`, \`bracket_id\`, \`room_name\`, \`role\`, \`role_name\`, \`is_active\`, \`used_count\`, \`expires_at\`, \`created_by\`, \`notes\`)
    VALUES
    ('CODE-01', 'IDN-BOSS-8821', 'COMP-01', 'PT Inovasi Digital Nusantara', 'LOBBY-01', 'Bracket 01 - Kantor Pusat Utama', 'boss', 'Boss / Pimpinan Eksekutif', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses pimpinan divisi kantor pusat dengan wewenang monitoring /leader.'),
    ('CODE-02', 'IDN-HUMAS-4412', 'COMP-01', 'PT Inovasi Digital Nusantara', 'LOBBY-01', 'Bracket 01 - Kantor Pusat Utama', 'humas', 'Humas / Corporate Affairs PIC', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'PIC penghubung perusahaan resmi dengan platform NeuroSim Pro.'),
    ('CODE-03', 'IDN-STAFF-1092', 'COMP-01', 'PT Inovasi Digital Nusantara', 'LOBBY-01', 'Bracket 01 - Kantor Pusat Utama', 'staff', 'Staff Internal', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses seluruh workstation meja kerja dan fasilitas rapat tim internal.'),
    ('CODE-04', 'NTM-BOSS-7731', 'COMP-02', 'PT Nusantara Teknologi Mandiri', 'LOBBY-02', 'Bracket 02 - Divisi Engineering & AI', 'boss', 'Boss / Lead AI Engineer', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses pimpinan divisi engineering.'),
    ('CODE-05', 'NTM-HUMAS-3321', 'COMP-02', 'PT Nusantara Teknologi Mandiri', 'LOBBY-02', 'Bracket 02 - Divisi Engineering & AI', 'humas', 'Humas / Division PIC', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'PIC komunikasi teknis divisi AI.'),
    ('CODE-06', 'NTM-STAFF-6612', 'COMP-02', 'PT Nusantara Teknologi Mandiri', 'LOBBY-02', 'Bracket 02 - Divisi Engineering & AI', 'staff', 'Staff Engineering', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses tim AI developer dan engineer.'),
    ('CODE-07', 'KMD-BOSS-9912', 'COMP-03', 'PT Kreatif Media Digital', 'LOBBY-03', 'Bracket 03 - Divisi Product & Design', 'boss', 'Boss / Design Director', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses pimpinan studio kreatif.'),
    ('CODE-08', 'KMD-HUMAS-2211', 'COMP-03', 'PT Kreatif Media Digital', 'LOBBY-03', 'Bracket 03 - Divisi Product & Design', 'humas', 'Humas PIC Tim Kreatif', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'PIC komunikasi proyek desain.'),
    ('CODE-09', 'KMD-STAFF-5544', 'COMP-03', 'PT Kreatif Media Digital', 'LOBBY-03', 'Bracket 03 - Divisi Product & Design', 'staff', 'Staff Product & Design', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses tim desain dan prototipe.'),
    ('CODE-10', 'SAK-BOSS-1102', 'COMP-04', 'PT Solusi Awan Kolaborasi', 'LOBBY-04', 'Bracket 04 - Tim Remote Global', 'boss', 'Boss / Cloud Team Lead', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses pimpinan tim cloud remote.'),
    ('CODE-11', 'SAK-HUMAS-8841', 'COMP-04', 'PT Solusi Awan Kolaborasi', 'LOBBY-04', 'Bracket 04 - Tim Remote Global', 'humas', 'Humas PIC Global', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'PIC komunikasi tim remote global.'),
    ('CODE-12', 'SAK-STAFF-3390', 'COMP-04', 'PT Solusi Awan Kolaborasi', 'LOBBY-04', 'Bracket 04 - Tim Remote Global', 'staff', 'Staff Remote Global', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses tim operasional awan remote.'),
    ('CODE-13', 'VKA-BOSS-5501', 'COMP-05', 'PT Ventura Kapital Asia', 'LOBBY-05', 'Bracket 05 - Ruang Eksekutif & Klien', 'boss', 'Boss / Managing Partner', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses managing partner eksekutif.'),
    ('CODE-14', 'VKA-HUMAS-6632', 'COMP-05', 'PT Ventura Kapital Asia', 'LOBBY-05', 'Bracket 05 - Ruang Eksekutif & Klien', 'humas', 'Humas / Executive Liaison', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Penghubung perizinan tamu VIP.'),
    ('CODE-15', 'VKA-STAFF-7721', 'COMP-05', 'PT Ventura Kapital Asia', 'LOBBY-05', 'Bracket 05 - Ruang Eksekutif & Klien', 'staff', 'Staff Investment Analyst', 1, 0, '2026-12-31T23:59:59Z', 'Super Admin', 'Akses analis investasi dan tim periset.')
    ON DUPLICATE KEY UPDATE \`code\`=VALUES(\`code\`), \`is_active\`=VALUES(\`is_active\`);
  `);

  console.log('Seeding billing sessions into MySQL...');
  await conn.query(`
    INSERT INTO \`billing_sessions\` (\`id\`, \`company_name\`, \`billing_key\`, \`plan\`, \`max_seats_per_bracket\`, \`total_allocated_lobbies\`, \`status\`, \`valid_until\`, \`contact_email\`, \`assigned_lobbies_json\`, \`humas_name\`, \`humas_email\`, \`humas_phone\`, \`notes\`)
    VALUES
    ('BILL-01', 'PT Inovasi Digital Nusantara', 'BILL-IDN-2026-HQ', 'enterprise_pro', 20, 1, 'active', '2026-12-31T23:59:59Z', 'rina.wijaya@inovasidigital.co.id', '["LOBBY-01"]', 'Rina Wijaya, S.I.Kom', 'rina.wijaya@inovasidigital.co.id', '+62 812-8889-1001', 'Kantor Pusat HQ - Paket Enterprise Unlimited 20 Kursi'),
    ('BILL-02', 'PT Nusantara Teknologi Mandiri', 'BILL-NTM-8891-ENG', 'enterprise_pro', 20, 1, 'active', '2026-12-31T23:59:59Z', 'dimas.pratama@nusantaratech.id', '["LOBBY-02"]', 'Dimas Pratama, M.T', 'dimas.pratama@nusantaratech.id', '+62 813-7722-4411', 'Divisi Engineering & AI - Dedicated GPU Audio/Video Node'),
    ('BILL-03', 'PT Kreatif Media Digital', 'BILL-KMD-4521-PRD', 'business_growth', 20, 1, 'active', '2026-12-31T23:59:59Z', 'sheila@kreatifmedia.com', '["LOBBY-03"]', 'Sheila Amanda', 'sheila@kreatifmedia.com', '+62 811-9988-3322', 'Divisi Product & Design - 20 Kursi Kolaborasi Kreatif'),
    ('BILL-04', 'PT Solusi Awan Kolaborasi', 'BILL-SAK-7712-REM', 'enterprise_pro', 20, 1, 'active', '2026-12-31T23:59:59Z', 'fajar@solusiawan.co.id', '["LOBBY-04"]', 'Fajar Nugroho', 'fajar@solusiawan.co.id', '+62 856-1122-3344', 'Tim Remote Global Lintas Zona Waktu'),
    ('BILL-05', 'PT Ventura Kapital Asia', 'BILL-VKA-9900-EXEC', 'enterprise_pro', 20, 1, 'active', '2026-12-31T23:59:59Z', 'amanda@venturakapital.asia', '["LOBBY-05"]', 'Amanda Valerie, B.Com', 'amanda@venturakapital.asia', '+62 812-9900-5566', 'Ruang Eksekutif & Pertemuan Klien Prioritas')
    ON DUPLICATE KEY UPDATE \`billing_key\`=VALUES(\`billing_key\`);
  `);

  console.log('Seeding initial audit logs into MySQL...');
  await conn.query(`
    INSERT INTO \`activity_logs\` (\`category\`, \`action\`, \`actor\`, \`details\`)
    VALUES
    ('security', 'SYSTEM_INIT', 'Nandzzz', 'Database neurosim_db berhasil diinisialisasi dengan enkripsi kernel & akun super admin Nandzzz.'),
    ('auth', 'ADMIN_ACCOUNT_PROVISIONED', 'System', 'Akun Super Admin @Nandzzz aktif dengan akses penuh ke seluruh ruangan dan server bracket.');
  `);

  console.log('All migrations and seeds successfully applied to MySQL!');
  await conn.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

