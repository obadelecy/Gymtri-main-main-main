const pool = require("../../config/pool_conexoes");
 
const profisModel = {
    // Cadastrar profissional
    create: async (dados) => {
        try {
            // Validar dados
            const validarDados = (dados) => {
                const erros = [];
                
                // Validar campos obrigatórios
                if (!dados.NUMERO_DOC) {
                    erros.push('Número do documento é obrigatório');
                }
                
                // Validar tamanhos máximos
                if (dados.NOME && dados.NOME.length > 60) {
                    erros.push('Nome deve ter no máximo 60 caracteres');
                }
                if (dados.EMAIL && dados.EMAIL.length > 60) {
                    erros.push('E-mail deve ter no máximo 60 caracteres');
                }
                if (dados.PROFISSAO && dados.PROFISSAO.length > 30) {
                    erros.push('Profissão deve ter no máximo 30 caracteres');
                }
                if (dados.SENHA && dados.SENHA.length > 60) {
                    erros.push('Senha deve ter no máximo 60 caracteres');
                }
                
                // Validar formatos
                if (dados.NUMERO_DOC && dados.NUMERO_DOC.length > 14) {
                    erros.push('Número do documento deve ter no máximo 14 caracteres');
                }
                if (dados.TELEFONE && dados.TELEFONE.length > 20) {
                    erros.push('Telefone deve ter no máximo 20 caracteres');
                }
                if (dados.CPF_PROF && dados.CPF_PROF.length > 60) {
                    erros.push('CPF deve ter no máximo 60 caracteres');
                }
                
                return erros;
            };

            // Validar dados
            const erros = validarDados(dados);
            if (erros.length > 0) {
                throw new Error(erros.join(', '));
            }

            // Garantir que todos os campos existam
            const profissional = {
                NUMERO_DOC: dados.NUMERO_DOC,
                NOME: dados.NOME,
                TELEFONE: dados.TELEFONE,
                EMAIL: dados.EMAIL,
                CPF_PROF: dados.CPF_PROF,
                PROFISSAO: dados.PROFISSAO,
                SENHA: dados.SENHA
            };

            // Inserir usando campos específicos
            const [resultado] = await pool.query(
                `INSERT INTO PROFISSIONAIS 
                 (NUMERO_DOC, NOME, TELEFONE, EMAIL, CPF_PROF, PROFISSAO, SENHA) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [profissional.NUMERO_DOC, profissional.NOME, profissional.TELEFONE, 
                 profissional.EMAIL, profissional.CPF_PROF, profissional.PROFISSAO, 
                 profissional.SENHA]
            );

            return resultado;
        } catch (error) {
            console.error('Erro ao criar profissional:', error);
            throw error;
        }
    },
    // create: async (dados) => {
    //     const {
    //         fullname,
    //         emailRegister,
    //         profession,
    //         numberRegister,
    //         passwordRegister,
    //         numberDoc,
    //         cpfRegister
    //     } = dados;
    //     //VALUES (?, ?, ?, ?, ?, ?, ?)
    //     try {
    //         const [resultado] = await pool.query(
    //             `INSERT INTO PROFISSIONAIS
    //             (nome, email, profissao, numero_doc, senha, telefone, cpf_prof)
    //             `,
    //             [fullname, emailRegister, profession, numberDoc, passwordRegister, numberRegister, cpfRegister]
    //         );
    //         return resultado.insertId;
 
    // Buscar profissional por e-mail
    findProfisByEmail: async (email) => {
        try {
            if (!email) {
                throw new Error('E-mail é obrigatório');
            }
            if (email.length > 60) {
                throw new Error('E-mail deve ter no máximo 60 caracteres');
            }

            const [resultado] = await pool.query(
                `SELECT * FROM PROFISSIONAIS WHERE EMAIL = ?`,
                [email]
            );
            return resultado;
        } catch (erro) {
            console.error("Erro ao buscar profissional por e-mail:", erro);
            throw erro;
        }
    },

    // Buscar todos os profissionais
    findAll: async () => {
        try {
            const [resultado] = await pool.query(
                `SELECT * FROM PROFISSIONAIS`
            );
            return resultado;
        } catch (erro) {
            console.error("Erro ao buscar profissionais:", erro);
            throw erro;
        }
    },

    // Buscar por número do documento
    findByNumeroDoc: async (numeroDoc) => {
        try {
            if (!numeroDoc) {
                throw new Error('Número do documento é obrigatório');
            }
            if (numeroDoc.length > 14) {
                throw new Error('Número do documento deve ter no máximo 14 caracteres');
            }

            const [resultado] = await pool.query(
                `SELECT * FROM PROFISSIONAIS WHERE NUMERO_DOC = ?`,
                [numeroDoc]
            );
            return resultado[0];
        } catch (erro) {
            console.error("Erro ao buscar profissional por número do documento:", erro);
            throw erro;
        }
    },
 
    // Atualizar profissional
    update: async (dados) => {
        try {
            // Validar dados
            const erros = this.validarDados(dados);
            if (erros.length > 0) {
                throw new Error(erros.join(', '));
            }

            // Montar objeto com campos específicos
            const profissional = {
                NUMERO_DOC: dados.NUMERO_DOC,
                NOME: dados.NOME,
                TELEFONE: dados.TELEFONE,
                EMAIL: dados.EMAIL,
                CPF_PROF: dados.CPF_PROF,
                PROFISSAO: dados.PROFISSAO,
                SENHA: dados.SENHA
            };

            // Atualizar usando campos específicos
            const [resultado] = await pool.query(
                `UPDATE PROFISSIONAIS 
                 SET NOME = ?, TELEFONE = ?, EMAIL = ?, CPF_PROF = ?, PROFISSAO = ?, SENHA = ?
                 WHERE NUMERO_DOC = ?`,
                [profissional.NOME, profissional.TELEFONE, profissional.EMAIL, 
                 profissional.CPF_PROF, profissional.PROFISSAO, profissional.SENHA,
                 profissional.NUMERO_DOC]
            );

            return resultado.affectedRows;
        } catch (erro) {
            console.error("Erro ao atualizar profissional:", erro);
            throw erro;
        }
    },

    findEmail: async (email) => {
        try {
            console.log('Buscando profissional por email:', email);
            const [resultado] = await pool.query(
                `SELECT 
                    NOME,
                    EMAIL,
                    SENHA,
                    CPF_PROF,
                    NUMERO_DOC,
                    TELEFONE,
                    PROFISSAO
                FROM PROFISSIONAIS 
                WHERE EMAIL = ?`,
                [email]
            );
            console.log('Resultado da busca por email:', resultado);
            return resultado;
        } catch (erro) {
            console.error("Erro ao buscar profissional por email:", {
                message: erro.message,
                sql: erro.sql,
                code: erro.code,
                sqlMessage: erro.sqlMessage
            });
            throw erro;
        }
    },
 
    // Buscar profissionais por nome (autocomplete)
    buscarPorNome: async (nome) => {
        try {
            const [resultados] = await pool.query(
                `SELECT 
                    NUMERO_DOC as id,
                    NOME as nome,
                    PROFISSAO as especialidade,
                    NUMERO_DOC as registro
                FROM PROFISSIONAIS 
                WHERE NOME LIKE ? 
                LIMIT 10`,
                [`%${nome}%`]
            );
            return resultados;
        } catch (error) {
            console.error("Erro ao buscar profissionais por nome:", error);
            throw error;
        }
    },
    
    // Listar todos os profissionais ativos
    listarAtivos: async () => {
        try {
            const [resultados] = await pool.query(
                `SELECT 
                    NUMERO_DOC as id,
                    NOME as nome,
                    PROFISSAO as especialidade,
                    NUMERO_DOC as registro
                FROM PROFISSIONAIS 
                WHERE 1`
            );
            return resultados;
        } catch (error) {
            console.error("Erro ao listar profissionais ativos:", error);
            throw error;
        }
    },
    
    // "Deletar" profissional (soft delete)
    // delete: async (id) => {
    //     try {
    //         const [resultado] = await pool.query(
    //             `UPDATE PROFISSIONAIS 
    //             SET  = 0 
    //             WHERE id_profissional = ?`,
    //             [id]
    //         );
    //         return resultado.affectedRows > 0;
    //     } catch (error) {
    //         console.error("Erro ao deletar profissional:", error);
    //         throw error;
    //     }
    // }
};
 
module.exports = profisModel;