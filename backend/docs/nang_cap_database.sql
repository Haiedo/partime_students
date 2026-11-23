-- GR7 – Nâng cấp database ĐANG CÓ lên cấu trúc mới nhất, GIỮ NGUYÊN dữ liệu
-- Máy cài mới: chạy create_db.sql rồi parttime_db_schema.sql, KHÔNG cần file này.
-- Máy đã có dữ liệu: chạy cả file này; bước nào đã có thì tự bỏ qua, chạy lại nhiều lần vẫn an toàn.
-- (MySQL 8 không có "ADD COLUMN IF NOT EXISTS" nên mỗi bước tự kiểm tra trong information_schema.)
USE parttime_db;

DROP PROCEDURE IF EXISTS gr7_run_if;
DELIMITER //
CREATE PROCEDURE gr7_run_if(IN need INT, IN stmt TEXT)
BEGIN
  IF need > 0 THEN
    SET @gr7_sql = stmt;
    PREPARE s FROM @gr7_sql; EXECUTE s; DEALLOCATE PREPARE s;
  END IF;
END //
DELIMITER ;

-- 1. Tài khoản: đăng nhập Google không có mật khẩu; tùy chọn nhận email
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_notify'),
  'ALTER TABLE users ADD COLUMN email_notify BOOLEAN NOT NULL DEFAULT TRUE AFTER status');

-- 2. Hồ sơ sinh viên: lịch rảnh available_slots (21 bit = 7 ngày x 3 buổi), khu vực muốn làm
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_profiles' AND COLUMN_NAME = 'available_slots'),
  'ALTER TABLE student_profiles ADD COLUMN available_slots INT NOT NULL DEFAULT 0');
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_profiles' AND COLUMN_NAME = 'preferred_area'),
  'ALTER TABLE student_profiles ADD COLUMN preferred_area VARCHAR(150) NULL');
-- Cột free_slots cũ trùng ý nghĩa với available_slots, code không dùng
CALL gr7_run_if((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_profiles' AND COLUMN_NAME = 'free_slots'),
  'ALTER TABLE student_profiles DROP COLUMN free_slots');

-- 3. Tin tuyển dụng: ca làm, trạng thái có PENDING / REJECTED, lý do từ chối
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'shift_slots'),
  'ALTER TABLE job_posts ADD COLUMN shift_slots INT NOT NULL DEFAULT 0 AFTER work_time');
ALTER TABLE job_posts MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'OPEN';
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'reject_reason'),
  'ALTER TABLE job_posts ADD COLUMN reject_reason VARCHAR(500) NULL');
ALTER TABLE job_posts MODIFY COLUMN reject_reason VARCHAR(500) NULL;
-- Bỏ cột approval_status nếu máy nào lỡ chạy bản nâng cấp không dùng
CALL gr7_run_if((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND INDEX_NAME = 'idx_job_approval'),
  'ALTER TABLE job_posts DROP INDEX idx_job_approval');
CALL gr7_run_if((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'approval_status'),
  'ALTER TABLE job_posts DROP COLUMN approval_status');

-- 4. Chỉ mục tìm kiếm tin (NFR-01)
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND INDEX_NAME = 'idx_job_shift'),
  'ALTER TABLE job_posts ADD KEY idx_job_shift (shift_slots)');
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND INDEX_NAME = 'idx_job_open_newest'),
  'ALTER TABLE job_posts ADD KEY idx_job_open_newest (status, hidden, created_at)');
CALL gr7_run_if((SELECT COUNT(*) = 0 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND INDEX_NAME = 'idx_job_employer_created'),
  'ALTER TABLE job_posts ADD KEY idx_job_employer_created (employer_id, created_at)');

-- 5. Thông báo: VARCHAR để lưu được loại mới (MATCHING_JOB, JOB_PENDING_APPROVAL)
ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL;

-- 6. Các bảng thêm ở Sprint 5 (chưa có thì tạo)
CREATE TABLE IF NOT EXISTS social_accounts (
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  user_id           BIGINT       NOT NULL,
  provider          ENUM('GOOGLE','FACEBOOK') NOT NULL,
  provider_user_id  VARCHAR(100) NOT NULL,
  email             VARCHAR(255) NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_provider_user (provider, provider_user_id),
  CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          BIGINT    NOT NULL AUTO_INCREMENT,
  user_id     BIGINT    NOT NULL,
  token_hash  CHAR(64)  NOT NULL,
  expires_at  DATETIME  NOT NULL,
  used_at     DATETIME  NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_jobs (
  id          BIGINT    NOT NULL AUTO_INCREMENT,
  student_id  BIGINT    NOT NULL,
  job_id      BIGINT    NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_student_job (student_id, job_id),
  CONSTRAINT fk_saved_student FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job     FOREIGN KEY (job_id)     REFERENCES job_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_reports (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  job_id       BIGINT       NOT NULL,
  reporter_id  BIGINT       NOT NULL,
  reason       ENUM('DEPOSIT','FALSE_INFO','SCAM','OTHER') NOT NULL,
  description  VARCHAR(500) NULL,
  status       ENUM('PENDING','RESOLVED','DISMISSED') NOT NULL DEFAULT 'PENDING',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  handled_at   DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_job_reporter (job_id, reporter_id),
  KEY idx_report_status (status),
  CONSTRAINT fk_report_job      FOREIGN KEY (job_id)      REFERENCES job_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES student_profiles(id)
) ENGINE=InnoDB;

DROP PROCEDURE gr7_run_if;

-- Kiểm tra: 11 bảng; job_posts có status varchar(30), reject_reason varchar(500);
-- notifications.type varchar(50); student_profiles có available_slots, không còn free_slots
SHOW TABLES;
SHOW COLUMNS FROM job_posts WHERE Field IN ('status', 'reject_reason');
SHOW COLUMNS FROM notifications LIKE 'type';
SHOW COLUMNS FROM student_profiles WHERE Field IN ('available_slots', 'free_slots');
