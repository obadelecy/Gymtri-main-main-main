const pool = require("../../config/pool_conexoes");

const academiaModel = {
    // Buscar todas as academias
    listarAtivas: async () => {
        try {
            const [resultados] = await pool.query(`
                SELECT 
                    CNPJ as id,
                    NOME_ACADEMIA as nome,
                    BAIRRO as bairro,
                    CIDADE as cidade,
                    UF as uf,
                    RUA as rua,
                    TELEFONE as telefone,
                    EMAIL as email
                FROM ACADEMIA
            `);
            return resultados;
        } catch (erro) {
            console.error("Erro ao listar academias ativas:", erro);
            throw erro;
        }
    },

    // Buscar academias por nome (autocomplete)
    buscarPorNome: async (nome) => {
        try {
            const [resultados] = await pool.query(`
                SELECT 
                    CNPJ as id,
                    NOME_ACADEMIA as nome,
                    BAIRRO as bairro,
                    CIDADE as cidade,
                    UF as uf,
                    RUA as rua,
                    TELEFONE as telefone
                FROM ACADEMIA 
                WHERE NOME_ACADEMIA LIKE ? 
                LIMIT 10`,
                [`%${nome}%`]
            );
            return resultados;
        } catch (error) {
            console.error("Erro ao buscar academias por nome:", error);
            throw error;
        }
    },

    findEmail: async (email) => {
        try {
            console.log('Buscando academia por email:', email);
            const [resultados] = await pool.query(`
                SELECT 
                    CNPJ as id,
                    NOME_ACADEMIA as nome,
                    EMAIL,
                    SENHA,
                    TELEFONE,
                    BAIRRO,
                    CIDADE,
                    RUA,
                    UF
                FROM ACADEMIA 
                WHERE EMAIL = ?`,
                [email]
            );
            console.log('Resultado da busca por email (academia):', resultados);
            return resultados;
        } catch (erro) {
            console.error("Erro ao buscar academia por email:", {
                message: erro.message,
                sql: erro.sql,
                code: erro.code,
                sqlMessage: erro.sqlMessage
            });
            throw erro;
        }
    },

    // Buscar academia por CNPJ
    findById: async (cnpj) => {
        try {
            const [resultado] = await pool.query(`
                SELECT 
                    CNPJ as id,
                    NOME_ACADEMIA as nome,
                    EMAIL,
                    TELEFONE,
                    BAIRRO,
                    CIDADE,
                    RUA,
                    UF
                FROM ACADEMIA 
                WHERE CNPJ = ?`,
                [cnpj]
            );
            return resultado[0] || null;
        } catch (erro) {
            console.error("Erro ao buscar academia por ID:", erro);
            throw erro;
        }
    },

    // Criar nova academia
    create: async (academia) => {
        try {
            const [resultado] = await pool.query(`
                INSERT INTO ACADEMIA (
                    CNPJ,
                    NOME_ACADEMIA,
                    EMAIL,
                    SENHA,
                    TELEFONE,
                    BAIRRO,
                    CIDADE,
                    RUA,
                    UF
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    academia.CNPJ,
                    academia.NOME_ACADEMIA,
                    academia.EMAIL,
                    academia.SENHA,
                    academia.TELEFONE,
                    academia.BAIRRO,
                    academia.CIDADE,
                    academia.RUA,
                    academia.UF
                ]
            );
            return resultado;
        } catch (error) {
            console.error('Erro ao criar academia:', error);
            throw error;
        }
    },

//     // Atualizar dados da academia
//     update: async (academia, id) => {
//         try {
//             const [linhas] = await pool.query('UPDATE tarefas SET ? WHERE id_tarefa = ?', [academia, id])
//             return linhas;
//         } catch (error) {
//             return error;
//         }  
//     },

//     // Desativar academia (soft delete)
//     delete: async (academia, id) => {
//         try {
//             const [linhas] = await pool.query('UPDATE tarefas SET status_tarefa = 0  WHERE id_tarefa = ?', [academia, id])
//             return linhas;
//         } catch (error) {
//             return error;
//         }  
//     },
};

module.exports = academiaModel;