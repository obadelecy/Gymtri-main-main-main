-- Adiciona as colunas para soft delete na tabela ALUNO se não existirem
ALTER TABLE ALUNO 
ADD COLUMN IF NOT EXISTS STATUS_ALUNO TINYINT(1) DEFAULT 1 COMMENT '1 para ativo, 0 para inativo',
ADD COLUMN IF NOT EXISTS DATA_INATIVACAO DATETIME DEFAULT NULL COMMENT 'Data em que o aluno foi inativado';
