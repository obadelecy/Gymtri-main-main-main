const pool = require("../../config/pool_conexoes");

// Função auxiliar para executar queries com tratamento de conexão e reconexão
async function executeQuery(query, params = [], maxRetries = 3) {
    let connection;
    let retryCount = 0;
    const retryDelay = 1000; // 1 segundo
    
    while (retryCount < maxRetries) {
        try {
            // Obter uma nova conexão do pool
            connection = await pool.getConnection();
            
            // Verificar se a conexão ainda está ativa
            await connection.ping();
            
            // Executar a query
            const [rows] = await connection.query(query, params);
            
            // Liberar a conexão de volta para o pool
            if (connection) {
                connection.release();
            }
            
            return rows;
            
        } catch (error) {
            // Se a conexão foi perdida, vamos tentar novamente
            if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ETIMEDOUT') {
                retryCount++;
                console.warn(`Tentativa ${retryCount}/${maxRetries} - Reconectando ao banco de dados...`);
                
                // Aguardar um pouco antes de tentar novamente
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
                }
                
                // Se ainda tivermos tentativas, continue o loop
                continue;
            }
            
            // Para outros erros, logue e lance a exceção
            console.error('Erro na execução da query:', {
                query,
                params,
                error: {
                    code: error.code,
                    errno: error.errno,
                    sqlState: error.sqlState,
                    sqlMessage: error.sqlMessage,
                    message: error.message,
                    stack: error.stack
                }
            });
            
            throw error;
            
        } finally {
            // Garantir que a conexão seja liberada em caso de erro
            if (connection && connection.release) {
                try {
                    connection.release();
                } catch (releaseError) {
                    console.error('Erro ao liberar conexão:', releaseError);
                }
            }
        }
    }
    
    throw new Error(`Não foi possível executar a query após ${maxRetries} tentativas`);
}

const alunoModel = {
    // Buscar todos os alunos ativos
    findAll: async () => {
        try {
            return await executeQuery(
                `SELECT * FROM aluno
                 WHERE status_aluno = 1`
            );
        } catch (erro) {
            console.error("Erro no findAll:", erro);
            return [];
        }
    },

    findEmail: async (email) => {
        try {
            console.log('Buscando aluno por email:', email);
            const query = `
                SELECT 
                    CPF,
                    NOME_COMPLETO,
                    EMAIL,
                    SENHA,
                    TELEFONE,
                    BAIRRO,
                    CIDADE
                FROM ALUNO 
                WHERE EMAIL = ?`;
                
            const resultados = await executeQuery(query, [email]);
            console.log('Resultado da busca por email (aluno):', resultados);
            return resultados || [];
        } catch (erro) {
            console.error("Erro ao buscar aluno por email:", {
                message: erro.message,
                code: erro.code,
                sqlMessage: erro.sqlMessage
            });
            
            if (erro.code === 'ER_USER_LIMIT_REACHED') {
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
            const resultado = await executeQuery(
                'SELECT * FROM ALUNO WHERE CPF = ?',
                [id]
            );
            return resultado[0] || null;
        } catch (erro) {
            console.error("Erro ao buscar aluno por ID:", erro);
            return null;
        }
    },

    // Criar novo aluno
    create: async (aluno) => {
        try {
            const resultado = await executeQuery(
                'INSERT INTO ALUNO SET ?',
                [aluno]
            );
            return resultado;
        } catch (erro) {
            console.error("Erro ao criar aluno:", erro);
            throw erro;
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
            
            const resultado = await executeQuery(
                'UPDATE ALUNO SET ? WHERE CPF = ?', 
                [dadosAtualizaveis, cpf]
            );
            return resultado;
        } catch (error) {
            console.error('Erro ao atualizar aluno:', error);
            throw error;
        }
    },

    // Desativar aluno (soft delete)
    delete: async (cpf) => {
        let connection;
        try {
            console.log('Iniciando exclusão da conta com CPF:', cpf);
            
            // Verifica se a tabela tem a coluna STATUS_ALUNO
            const columns = await executeQuery(
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
            const resultado = await executeQuery(query, params);
            
            console.log('Resultado da exclusão:', resultado);
            return resultado;
            
        } catch (error) {
            console.error('Erro ao desativar aluno:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            
            throw error;
        }
    },
};

module.exports = alunoModel;