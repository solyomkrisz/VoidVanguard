CREATE DATABASE voidvanguard
DEFAULT CHARACTER SET utf8
COLLATE utf8_hungarian_ci;

USE voidvanguard;

CREATE TABLE users(
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    role INT(2) NOT NULL DEFAULT 0,
    email VARCHAR(255) UNIQUE NOT NULL,
    gender TINYINT UNSIGNED NOT NULL,
    password_hash CHAR(60) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens(
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(60) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE TABLE profiles(
    user_id CHAR(36) PRIMARY KEY,
    avatar VARCHAR(60) DEFAULT NULL,
    display_name VARCHAR(60) NOT NULL,
    description TEXT DEFAULT NULL,
    visibility VARCHAR(30) NOT NULL DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE TABLE friends(
    id CHAR(32) PRIMARY KEY,
    initiator_id CHAR(36) NOT NULL,
    recipient_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (initiator_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    FOREIGN KEY (recipient_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

DELIMITER // 
CREATE TRIGGER friends_before_insert
BEFORE INSERT ON friends
FOR EACH ROW
BEGIN
    DECLARE a CHAR(36);
    DECLARE b CHAR(36);

    IF NEW.initiator_id = NEW.recipient_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User cannot befriend themselves';
    END IF;

    SET a = LEAST(NEW.initiator_id, NEW.recipient_id);
    SET b = GREATEST(NEW.initiator_id, NEW.recipient_id);

    SET NEW.id = MD5(CONCAT(a, b));
END //
DELIMITER ;

CREATE TABLE blocks(
    blocker_id CHAR(36),
    blocked_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (blocker_id, blocked_id),

    FOREIGN KEY (blocker_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (blocked_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

DELIMITER //
CREATE TRIGGER blocks_before_insert
BEFORE INSERT ON blocks
FOR EACH ROW
BEGIN
    IF NEW.blocker_id = NEW.blocked_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User cannot block themselves';
    END IF;
END //
DELIMITER ;

CREATE TABLE comments(
    id CHAR(36) PRIMARY KEY,
    author_id CHAR(36) NOT NULL,
    target_type ENUM("post", "profile") NOT NULL,
    target_id CHAR(36) NOT NULL,
    parent_id CHAR(36) DEFAULT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    FOREIGN KEY (parent_id) REFERENCES comments(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    INDEX idx_target (target_type, target_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE reactions(
    user_id CHAR(36),
    target_type ENUM("post", "comment"),
    target_id CHAR(36),
    type TINYINT NOT NULL,

    PRIMARY KEY (user_id, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);