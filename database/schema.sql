CREATE DATABASE IF NOT EXISTS planair_ponto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE planair_ponto;

CREATE TABLE funcionarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  cargo VARCHAR(100),
  carga_horaria_diaria_minutos INT NOT NULL DEFAULT 480,
  horario_entrada TIME NOT NULL DEFAULT '08:00:00',
  horario_saida_almoco TIME NOT NULL DEFAULT '12:00:00',
  horario_retorno_almoco TIME NOT NULL DEFAULT '13:00:00',
  horario_saida TIME NOT NULL DEFAULT '17:00:00',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_carga_positiva CHECK (carga_horaria_diaria_minutos > 0)
);

CREATE TABLE registros_ponto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NOT NULL,
  data_referencia DATE NOT NULL,
  entrada DATETIME NULL,
  saida_almoco DATETIME NULL,
  retorno_almoco DATETIME NULL,
  saida DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_registro_dia UNIQUE (funcionario_id, data_referencia),
  CONSTRAINT fk_registro_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
);

CREATE TABLE justificativas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NOT NULL,
  data_referencia DATE NOT NULL,
  observacao TEXT NOT NULL,
  arquivo_pdf VARCHAR(255) NOT NULL,
  status ENUM('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
  observacao_admin TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
);

CREATE TABLE ocorrencias_admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NOT NULL,
  data_referencia DATE NOT NULL,
  observacao TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
);

INSERT INTO funcionarios (nome, email, cargo, carga_horaria_diaria_minutos)
VALUES ('Funcionário de teste', 'teste@planair.com.br', 'Atendente', 480);
