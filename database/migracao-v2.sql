USE planair_ponto;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NULL UNIQUE,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('ADMIN', 'FUNCIONARIO') NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id)
    REFERENCES funcionarios(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feriados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  tipo ENUM('nacional', 'estadual', 'municipal') NOT NULL DEFAULT 'nacional'
);

CREATE TABLE IF NOT EXISTS ajustes_jornada (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NOT NULL,
  data_referencia DATE NOT NULL,
  tipo ENUM(
    'atraso',
    'saida_antecipada',
    'falta_justificada',
    'falta_nao_justificada',
    'saida_autorizada',
    'abono',
    'outro'
  ) NOT NULL,
  impacto_minutos INT NOT NULL DEFAULT 0,
  observacao TEXT NOT NULL,
  criado_por_usuario_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id)
    REFERENCES funcionarios(id)
    ON DELETE CASCADE,
  FOREIGN KEY (criado_por_usuario_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS historico_jornada (
  id INT AUTO_INCREMENT PRIMARY KEY,
  funcionario_id INT NOT NULL,
  valido_a_partir_de DATE NOT NULL,
  carga_horaria_diaria_minutos INT NOT NULL,
  horario_entrada TIME NOT NULL,
  horario_saida_almoco TIME NOT NULL,
  horario_retorno_almoco TIME NOT NULL,
  horario_saida TIME NOT NULL,
  observacao TEXT,
  criado_por_usuario_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionario_id)
    REFERENCES funcionarios(id)
    ON DELETE CASCADE,
  FOREIGN KEY (criado_por_usuario_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  acao VARCHAR(120) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id INT NULL,
  detalhes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
);