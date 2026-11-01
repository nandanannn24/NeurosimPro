-- =============================================================================
-- NEUROSIM PRO DATABASE SCHEMA (MySQL 8.0+)
-- Database: neurosim_db
-- Product: NEUROSIM PRO (Virtual Office Simulation & Remote Collaboration)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `neurosim_db` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `neurosim_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: organizations
-- Multi-tenant organization accounts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `logo_url` VARCHAR(255) DEFAULT '/logo.webp',
  `plan` ENUM('starter', 'professional', 'enterprise') DEFAULT 'professional',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_org_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: roles
-- System and organization level roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(32) NOT NULL UNIQUE,
  `description` TEXT,
  `level` INT UNSIGNED DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: permissions
-- Granular access permissions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `category` VARCHAR(32) NOT NULL DEFAULT 'general',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: role_permissions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: users
-- Core user accounts with credentials & accessibility preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `org_id` INT UNSIGNED DEFAULT 1,
  `role_id` INT UNSIGNED DEFAULT 4,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(128) NOT NULL,
  `title` VARCHAR(100) DEFAULT 'Software Engineer',
  `department` VARCHAR(100) DEFAULT 'Product & Engineering',
  `avatar` VARCHAR(255) DEFAULT '/assets/characters/resident/standing/south.png',
  `status` ENUM('available', 'busy', 'dnd', 'meeting', 'away') DEFAULT 'available',
  `is_active` TINYINT(1) DEFAULT 1,
  `reduce_motion` TINYINT(1) DEFAULT 0,
  `high_contrast` TINYINT(1) DEFAULT 0,
  `text_scale` VARCHAR(20) DEFAULT 'normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_org` (`org_id`),
  CONSTRAINT `fk_users_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: organization_members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organization_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `org_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_org_user` (`org_id`, `user_id`),
  CONSTRAINT `fk_om_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_om_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_om_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: workspaces
-- Workspaces within an organization
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` VARCHAR(64) PRIMARY KEY,
  `org_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ws_org` (`org_id`),
  CONSTRAINT `fk_ws_org` FOREIGN KEY (`org_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: workspace_members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workspace_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` VARCHAR(32) DEFAULT 'member',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_ws_member` (`workspace_id`, `user_id`),
  CONSTRAINT `fk_wm_ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: office_rooms
-- Virtual office room environments within workspaces
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `office_rooms` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspace_id` VARCHAR(64) NOT NULL DEFAULT 'ws-hq-main',
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `type` ENUM('main_office', 'meeting_room', 'private_meeting', 'breakout_room', 'discussion_room', 'lounge', 'pantry', 'focus_room') DEFAULT 'main_office',
  `description` TEXT,
  `zone` VARCHAR(64) NOT NULL,
  `spawn_x` INT DEFAULT 1687,
  `spawn_y` INT DEFAULT 880,
  `capacity` INT DEFAULT 25,
  `is_private` TINYINT(1) DEFAULT 0,
  `passcode` VARCHAR(32) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_or_ws` (`workspace_id`),
  INDEX `idx_or_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Table: room_members
-- Active or allowed members per room
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `room_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rm_user` (`room_id`, `user_id`),
  CONSTRAINT `fk_rm_room` FOREIGN KEY (`room_id`) REFERENCES `office_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: user_profiles
-- Extended profile information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `bio` TEXT,
  `phone` VARCHAR(32),
  `title` VARCHAR(100),
  `department` VARCHAR(100),
  `timezone` VARCHAR(50) DEFAULT 'Asia/Jakarta',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Table: character_customizations
-- Universal LPC Sprite settings per user
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `character_customizations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `archetype` VARCHAR(50) DEFAULT 'resident',
  `gender` VARCHAR(20) DEFAULT 'male',
  `body_type` VARCHAR(30) DEFAULT 'standard',
  `skin_tone` VARCHAR(30) DEFAULT 'peach',
  `hair_style` VARCHAR(50) DEFAULT 'short-parted',
  `hair_color` VARCHAR(30) DEFAULT 'black',
  `eye_color` VARCHAR(30) DEFAULT 'dark-brown',
  `facial_hair` VARCHAR(50) DEFAULT 'none',
  `glasses` VARCHAR(50) DEFAULT 'none',
  `shirt_type` VARCHAR(50) DEFAULT 'collared-formal',
  `shirt_color` VARCHAR(30) DEFAULT 'white',
  `suit_type` VARCHAR(50) DEFAULT 'none',
  `suit_color` VARCHAR(30) DEFAULT 'navy-suit',
  `tie_type` VARCHAR(50) DEFAULT 'none',
  `tie_color` VARCHAR(30) DEFAULT 'crimson',
  `pants_type` VARCHAR(50) DEFAULT 'slacks-formal',
  `pants_color` VARCHAR(30) DEFAULT 'charcoal',
  `shoes_type` VARCHAR(50) DEFAULT 'oxford-leather',
  `shoes_color` VARCHAR(30) DEFAULT 'black-leather',
  `accessory` VARCHAR(50) DEFAULT 'none',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Table: meetings
-- Video conference sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspace_id` VARCHAR(64) NOT NULL DEFAULT 'ws-hq-main',
  `host_user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `passcode` VARCHAR(32) DEFAULT NULL,
  `is_locked` TINYINT(1) DEFAULT 0,
  `status` ENUM('scheduled', 'in_progress', 'ended', 'cancelled') DEFAULT 'scheduled',
  `max_participants` INT DEFAULT 50,
  `scheduled_start` TIMESTAMP NULL,
  `scheduled_end` TIMESTAMP NULL,
  `actual_start` TIMESTAMP NULL,
  `actual_end` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_meetings_code` (`code`),
  INDEX `idx_meetings_host` (`host_user_id`),
  CONSTRAINT `fk_meetings_host` FOREIGN KEY (`host_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Table: meeting_participants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meeting_participants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `meeting_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('host', 'cohost', 'participant') DEFAULT 'participant',
  `is_muted` TINYINT(1) DEFAULT 0,
  `is_camera_on` TINYINT(1) DEFAULT 0,
  `is_screen_sharing` TINYINT(1) DEFAULT 0,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `left_at` TIMESTAMP NULL,
  UNIQUE KEY `uk_mp_session` (`meeting_id`, `user_id`, `joined_at`),
  CONSTRAINT `fk_mp_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Table: meeting_invitations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `meeting_invitations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `meeting_id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `invite_token` VARCHAR(64) NOT NULL UNIQUE,
  `status` ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mi_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Table: breakout_rooms
-- Breakout rooms attached to a parent meeting
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `breakout_rooms` (
  `id` VARCHAR(64) PRIMARY KEY,
  `meeting_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `room_index` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('inactive', 'active', 'closed') DEFAULT 'inactive',
  `duration_seconds` INT UNSIGNED DEFAULT 900,
  `opened_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_br_meeting` (`meeting_id`),
  CONSTRAINT `fk_br_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. Table: breakout_room_members
-- Participants assigned to a breakout room
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `breakout_room_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `breakout_room_id` VARCHAR(64) NOT NULL,
  `meeting_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_brm_user` (`breakout_room_id`, `user_id`),
  CONSTRAINT `fk_brm_room` FOREIGN KEY (`breakout_room_id`) REFERENCES `breakout_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_brm_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_brm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. Table: chat_channels
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_channels` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspace_id` VARCHAR(64) DEFAULT NULL,
  `meeting_id` VARCHAR(64) DEFAULT NULL,
  `breakout_room_id` VARCHAR(64) DEFAULT NULL,
  `type` ENUM('global_workspace', 'room', 'meeting', 'breakout', 'direct') DEFAULT 'global_workspace',
  `name` VARCHAR(128) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cc_ws` (`workspace_id`),
  INDEX `idx_cc_meeting` (`meeting_id`),
  INDEX `idx_cc_breakout` (`breakout_room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. Table: chat_messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `channel_id` VARCHAR(64) NOT NULL,
  `sender_user_id` INT UNSIGNED DEFAULT NULL,
  `sender_name` VARCHAR(128) NOT NULL,
  `sender_avatar` VARCHAR(255) DEFAULT '/assets/characters/resident/standing/south.png',
  `message_text` TEXT NOT NULL,
  `message_type` ENUM('text', 'system', 'emoji') DEFAULT 'text',
  `is_pinned` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cm_channel` (`channel_id`),
  INDEX `idx_cm_created` (`created_at`),
  CONSTRAINT `fk_cm_channel` FOREIGN KEY (`channel_id`) REFERENCES `chat_channels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 20. Table: scenarios
-- Structured workplace communication simulation scenarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scenarios` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `difficulty_level` TINYINT UNSIGNED DEFAULT 2,
  `initial_situation` TEXT NOT NULL,
  `participant_role` VARCHAR(128) NOT NULL,
  `objectives_json` JSON NOT NULL,
  `evaluation_rubric_json` JSON NOT NULL,
  `dialogue_tree_json` JSON NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 21. Table: scenario_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scenario_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `scenario_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `selected_goal` TEXT,
  `current_turn` INT UNSIGNED DEFAULT 0,
  `status` ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
  `transcript_json` JSON,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  CONSTRAINT `fk_ss_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ss_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 22. Table: scenario_results
-- Objective 4-dimensional assessment results
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `scenario_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `clarity_score` VARCHAR(32) NOT NULL,
  `clarity_feedback` TEXT NOT NULL,
  `context_score` VARCHAR(32) NOT NULL,
  `context_feedback` TEXT NOT NULL,
  `goal_score` VARCHAR(32) NOT NULL,
  `goal_feedback` TEXT NOT NULL,
  `boundaries_score` VARCHAR(32) NOT NULL,
  `boundaries_feedback` TEXT NOT NULL,
  `overall_level_rec` ENUM('tetap', 'naik', 'turun') DEFAULT 'tetap',
  `alternative_concise` TEXT,
  `alternative_detailed` TEXT,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sr_user` (`user_id`),
  CONSTRAINT `fk_sr_session` FOREIGN KEY (`session_id`) REFERENCES `scenario_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 23. Table: activity_logs
-- Comprehensive audit and security logging
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `org_id` INT UNSIGNED DEFAULT 1,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `entity_id` VARCHAR(64) DEFAULT NULL,
  `details_json` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_al_org` (`org_id`),
  INDEX `idx_al_action` (`action`),
  INDEX `idx_al_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA: Roles, Permissions, Organization, Workspaces, and Initial Rooms
-- =============================================================================

INSERT INTO `organizations` (`id`, `name`, `slug`, `plan`) VALUES
(1, 'NeuroSim Pro Enterprise Workspace', 'neurosim-pro-hq', 'enterprise')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `level`) VALUES
(1, 'Super Administrator', 'super_admin', 'Full system management and global configurations', 100),
(2, 'Organization Administrator', 'org_admin', 'Manages members, workspaces, rooms, and meetings', 80),
(3, 'Manager / Team Leader', 'manager', 'Manages team meetings, breakout rooms, and agendas', 50),
(4, 'Employee / Member', 'employee', 'Virtual office workspace, meetings, chat, and training', 20),
(5, 'Guest / External Attendee', 'guest', 'Limited access to specific scheduled meetings', 10)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `workspaces` (`id`, `org_id`, `name`, `description`, `is_default`) VALUES
('ws-hq-main', 1, 'Headquarters Virtual Campus', 'Main corporate workspace with full 2D interactive floor and conference suites.', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `office_rooms` (`id`, `workspace_id`, `code`, `name`, `type`, `description`, `zone`, `spawn_x`, `spawn_y`, `capacity`) VALUES
('room-main', 'ws-hq-main', 'ROOM-MAIN-01', 'Kantor Utama & Open Workspace', 'main_office', 'Pusat workstation tim dengan meja kerja komputer, koridor navigasi sentral, dan area kolaborasi.', 'Workstation Utama', 1687, 880, 25),
('room-meeting', 'ws-hq-main', 'ROOM-MEET-02', 'Ruang Rapat Strategis', 'meeting_room', 'Ruang meeting formal berkarpet kayu untuk presentasi dan negosiasi proyek tim.', 'Ruang Rapat & Konferensi', 600, 480, 16),
('room-pantry', 'ws-hq-main', 'ROOM-PANTRY-03', 'Pantry & Coffee Breakroom', 'pantry', 'Area santai dengan espresso bar, meja kafe, dan ruang istirahat kolaboratif.', 'Pantry & Dapur', 480, 950, 15),
('room-executive', 'ws-hq-main', 'ROOM-EXEC-04', 'Ruang Eksekutif & Manajemen', 'private_meeting', 'Ruangan kerja manajemen untuk evaluasi terarah, pengarahan tim, dan meeting pimpinan.', 'Ruang Eksekutif & Manajemen', 2150, 360, 10),
('room-afk', 'ws-hq-main', 'ROOM-AFK-05', 'AFK Room & Area Santai', 'lounge', 'Ruang istirahat dan relaksasi tenang dilengkapi sofa empuk, sudut baca, dan dispenser.', 'AFK Room & Area Santai', 600, 1140, 12)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `capacity`=VALUES(`capacity`);

-- Seed default enterprise admin account (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO `users` (`id`, `org_id`, `role_id`, `username`, `email`, `password_hash`, `full_name`, `title`, `department`, `avatar`) VALUES
(1, 1, 1, 'admin', 'admin@neurosimpro.com', '$2b$10$wI5f67B8rQ5qD15O7U5Rce3X9lZ5P4s7T2wQ8X0rB7kL4mJ3p1eZa', 'Administrator NeuroSim Pro', 'Platform Administrator', 'Enterprise Operations', '/assets/characters/office-worker/standing/south.png'),
(2, 1, 3, 'manager', 'manager@neurosimpro.com', '$2b$10$wI5f67B8rQ5qD15O7U5Rce3X9lZ5P4s7T2wQ8X0rB7kL4mJ3p1eZa', 'Operations Lead', 'Team Manager', 'Engineering & Delivery', '/assets/characters/resident/standing/south.png'),
(3, 1, 4, 'employee', 'employee@neurosimpro.com', '$2b$10$wI5f67B8rQ5qD15O7U5Rce3X9lZ5P4s7T2wQ8X0rB7kL4mJ3p1eZa', 'Team Engineer', 'Software Engineer', 'Frontend & Simulation', '/assets/characters/resident/standing/south.png')
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);
