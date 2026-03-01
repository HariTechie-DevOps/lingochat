-- ============================================================
-- LingoChat - Local Development Database Schema
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uid          VARCHAR(36)  NOT NULL,
    username     VARCHAR(50)  NOT NULL,
    email        VARCHAR(255) NOT NULL,
    password     VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url   VARCHAR(512),
    native_lang  VARCHAR(10)  NOT NULL DEFAULT 'en',
    status       ENUM('ONLINE','OFFLINE','AWAY') NOT NULL DEFAULT 'OFFLINE',
    last_seen    DATETIME,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    role         ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_uid      (uid),
    UNIQUE KEY uq_username (username),
    UNIQUE KEY uq_email    (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(512) NOT NULL,
    user_id    BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME     NOT NULL,
    revoked    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_token (token(255)),
    INDEX idx_user_id   (user_id),
    INDEX idx_expires   (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uid             VARCHAR(36)  NOT NULL,
    type            ENUM('DIRECT','GROUP') NOT NULL DEFAULT 'DIRECT',
    name            VARCHAR(100),
    created_by      BIGINT UNSIGNED NOT NULL,
    last_message_at DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_uid (uid),
    INDEX idx_last_message (last_message_at DESC),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    role            ENUM('MEMBER','ADMIN') NOT NULL DEFAULT 'MEMBER',
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    last_read_at    DATETIME,
    joined_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conv_user (conversation_id, user_id),
    INDEX idx_user_active (user_id, is_active),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uid             VARCHAR(36)  NOT NULL,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id       BIGINT UNSIGNED NOT NULL,
    original_text   TEXT         NOT NULL,
    original_lang   VARCHAR(10)  NOT NULL,
    message_type    ENUM('TEXT','IMAGE','FILE','SYSTEM') NOT NULL DEFAULT 'TEXT',
    reply_to_id     BIGINT UNSIGNED,
    is_edited       TINYINT(1) NOT NULL DEFAULT 0,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_uid (uid),
    INDEX idx_conv_time  (conversation_id, created_at DESC),
    INDEX idx_sender     (sender_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)       REFERENCES users(id),
    FOREIGN KEY (reply_to_id)     REFERENCES messages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Translation cache
CREATE TABLE IF NOT EXISTS message_translations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message_id      BIGINT UNSIGNED NOT NULL,
    target_lang     VARCHAR(10)  NOT NULL,
    translated_text TEXT         NOT NULL,
    confidence      DECIMAL(4,3) NOT NULL DEFAULT 0.950,
    provider        VARCHAR(50),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_msg_lang (message_id, target_lang),
    INDEX idx_message_id (message_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: supported languages (reference table)
CREATE TABLE IF NOT EXISTS supported_languages (
    code        VARCHAR(10)  PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji  VARCHAR(10),
    is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO supported_languages VALUES
('en','English','English','🇬🇧',1),
('ja','Japanese','日本語','🇯🇵',1),
('zh','Chinese','中文','🇨🇳',1),
('hi','Hindi','हिन्दी','🇮🇳',1),
('ar','Arabic','العربية','🇸🇦',1),
('es','Spanish','Español','🇪🇸',1),
('fr','French','Français','🇫🇷',1),
('de','German','Deutsch','🇩🇪',1),
('pt','Portuguese','Português','🇧🇷',1),
('ru','Russian','Русский','🇷🇺',1),
('ko','Korean','한국어','🇰🇷',1),
('it','Italian','Italiano','🇮🇹',1),
('tr','Turkish','Türkçe','🇹🇷',1),
('vi','Vietnamese','Tiếng Việt','🇻🇳',1),
('th','Thai','ภาษาไทย','🇹🇭',1),
('id','Indonesian','Bahasa Indonesia','🇮🇩',1),
('bn','Bengali','বাংলা','🇧🇩',1),
('ta','Tamil','தமிழ்','🇮🇳',1),
('te','Telugu','తెలుగు','🇮🇳',1),
('ml','Malayalam','മലയാളം','🇮🇳',1),
('kn','Kannada','ಕನ್ನಡ','🇮🇳',1),
('ur','Urdu','اردو','🇵🇰',1),
('nl','Dutch','Nederlands','🇳🇱',1),
('pl','Polish','Polski','🇵🇱',1),
('sv','Swedish','Svenska','🇸🇪',1),
('el','Greek','Ελληνικά','🇬🇷',1),
('he','Hebrew','עברית','🇮🇱',1),
('fa','Persian','فارسی','🇮🇷',1),
('ms','Malay','Bahasa Melayu','🇲🇾',1),
('tl','Filipino','Filipino','🇵🇭',1),
('sw','Swahili','Kiswahili','🇰🇪',1),
('uk','Ukrainian','Українська','🇺🇦',1),
('ro','Romanian','Română','🇷🇴',1),
('hu','Hungarian','Magyar','🇭🇺',1),
('cs','Czech','Čeština','🇨🇿',1),
('fi','Finnish','Suomi','🇫🇮',1),
('da','Danish','Dansk','🇩🇰',1),
('no','Norwegian','Norsk','🇳🇴',1),
('af','Afrikaans','Afrikaans','🇿🇦',1),
('ca','Catalan','Català','🇪🇸',1);
