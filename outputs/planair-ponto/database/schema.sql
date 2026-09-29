CREATE DATABASE IF NOT EXISTS planair_ponto
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE planair_ponto;

CREATE TABLE employees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NULL UNIQUE,
  pin_hash VARCHAR(100) NOT NULL,
  daily_workload_minutes SMALLINT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (daily_workload_minutes BETWEEN 1 AND 1440)
);

CREATE TABLE managers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  name VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_punches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  punch_type ENUM('ENTRY','LUNCH_START','LUNCH_END','EXIT') NOT NULL,
  punched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_punch_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY one_punch_of_each_type_per_day (employee_id, punch_type, punched_at),
  INDEX idx_punch_employee_date (employee_id, punched_at)
);
