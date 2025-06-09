const pool = require("../../config/pool_conexoes");

const alunoModel = {
    // Buscar todos os alunos ativos
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                `SELECT * FROM aluno
                 WHERE status_aluno
                 = 1`
            );
            return resultados;
        } catch (erro) {
            console.error("Erro no findAll:", erro);
            return [];
        }
    },

    findEmail: async (email) => {
        try {
            console.log('Buscando aluno por email:', email);
            const [resultados] = await pool.query(
                `SELECT 
                    CPF,
                    NOME_COMPLETO,
                    EMAIL,
                    SENHA,
                    TELEFONE,
                    BAIRRO,
                    CIDADE
                FROM ALUNO 
                WHERE EMAIL = ?`,
                [email]
            );
            console.log('Resultado da busca por email (aluno):', resultados);
            return resultados;
        } catch (erro) {
            console.error("Erro ao buscar aluno por email:", {
                message: erro.message,
                sql: erro.sql,
                code: erro.code,
                sqlMessage: erro.sqlMessage
            });
            
            if (erro.code === 'ER_USER_LIMIT_REACHED') {
                // Se o erro for limite de conexões, tentamos novamente após um pequeno delay
                console.log("Tentando novamente após 1 segundo...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await alunoModel.findEmail(email);
            }
            
            throw erro;
        } finally {
            // Com pool.promise(), as conexões são liberadas automaticamente
            console.log("Conexão liberada automaticamente pelo pool.promise()");
        }
    },

    // Buscar aluno por ID
    findById: async (id) => {
        try {
            const [resultados] = await pool.query(
                `SELECT * FROM ALUNO 
                 WHERE CPF = ?`,
                [id]
            );
            return resultados;
        } catch (erro) {
            console.error("Erro no findById:", erro);
            return null;
        }
    },

    // Criar novo aluno
    create: async (aluno) => {
        try {
            const [linhas, campos] = await pool.query('INSERT INTO ALUNO SET ?', [aluno])
            console.log(linhas);
            console.log(campos);
            return linhas;
        } catch (error) {
            console.log(error);
            return null;
        }  
    },

    // Atualizar dados do aluno
    update: async (aluno, cpf) => {
        try {
            // Remover campos que não devem ser atualizados diretamente
            const { CPF, SENHA, ...dadosAtualizaveis } = aluno;
            
            // Se houver senha para atualizar, adicionar de volta
            if (aluno.SENHA) {
                dadosAtualizaveis.SENHA = aluno.SENHA;
            }
            
            const [resultado] = await pool.query('UPDATE ALUNO SET ? WHERE CPF = ?', [dadosAtualizaveis, cpf]);
            return resultado;
        } catch (error) {
            console.error('Erro ao atualizar aluno:', error);
            throw error;
        }  
    },

    // Desativar aluno (soft delete)
    delete: async (cpf) => {
        const connection = await pool.getConnection();
        try {
            console.log('Iniciando exclusão da conta com CPF:', cpf);
            
            // Inicia uma transação
            await connection.beginTransaction();
            
            // Verifica se a tabela tem a coluna STATUS_ALUNO
            const [columns] = await connection.query(
                "SHOW COLUMNS FROM ALUNO LIKE 'STATUS_ALUNO'"
            );
            
            let query;
            let params = [cpf];
            
            if (columns.length > 0) {
                // Se a coluna STATUS_ALUNO existir, faz um soft delete
                query = 'UPDATE ALUNO SET STATUS_ALUNO = 0, DATA_INATIVACAO = NOW() WHERE CPF = ?';
            } else {
                // Se não existir, faz um hard delete
                // IMPORTANTE: Isso removerá o registro permanentemente
                query = 'DELETE FROM ALUNO WHERE CPF = ?';
            }
            
            console.log('Executando query:', query);
            const [resultado] = await connection.query(query, params);
            
            // Confirma a transação
            await connection.commit();
            
            console.log('Resultado da exclusão:', resultado);
            return resultado;
            
        } catch (error) {
            // Desfaz a transação em caso de erro
            if (connection) await connection.rollback();
            
            console.error('Erro ao desativar aluno:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage,
                sql: error.sql
            });
            
            throw error;
        } finally {
            // Libera a conexão de volta para o pool
            if (connection) connection.release();
        }  
    },
};

module.exports = alunoModel;