-- Criar tabela de profissionais
CREATE TABLE IF NOT EXISTS profissionais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id_agendamento INT PRIMARY KEY AUTO_INCREMENT,
    numero_doc VARCHAR(20) NOT NULL,
    id_profissional INT,
    data_agendamento DATE,
    hora_agendamento TIME,
    motivo TEXT,
    status_agendamento BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_profissional) REFERENCES profissionais(id)
);

-- Inserir alguns profissionais de exemplo
INSERT INTO profissionais (nome, status) VALUES
('João Silva', 'ativo'),
('Maria Santos', 'ativo'),
('Carlos Pereira', 'ativo');
