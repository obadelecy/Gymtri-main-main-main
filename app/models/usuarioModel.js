const pool = require("../../config/pool_conexoes");

const usuarioModel = {
    // Buscar todos os usuários ativos
    findAll: async () => {
        try {
            const [resultados] = await pool.query(
                `SELECT * FROM usuario WHERE status_usuario = 1`
            );
            return resultados;
        } catch (erro) {
            console.error("Erro no findAll:", erro);
            return [];
        }
    },

    // Buscar usuário por ID
    findById: async (id_usuario) => {
        try {
            const [resultados] = await pool.query(
                `SELECT * FROM usuario WHERE id_usuario = ?`,
                [id_usuario]
            );
            return resultados;
        } catch (erro) {
            console.error("Erro no findById:", erro);
            return null;
        }
    },

    // Criar novo usuário
    create: async (usuario) => {
        try {
            const [resultado] = await pool.query(
                `INSERT INTO usuario 
                (nome_usuario, email_usuario, senha_usuario, tipo_usuario, telefone_usuario, data_nascimento, genero_usuario, cep_usuario, numero_usuario, complemento_usuario, img_perfil_pasta, img_perfil_banco) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario.nome_usuario,
                    usuario.email_usuario,
                    usuario.senha_usuario,
                    usuario.tipo_usuario,
                    usuario.telefone_usuario || null,
                    usuario.data_nascimento || null,
                    usuario.genero_usuario || null,
                    usuario.cep_usuario || null,
                    usuario.numero_usuario || null,
                    usuario.complemento_usuario || null,
                    usuario.img_perfil_pasta || null,
                    usuario.img_perfil_banco || null
                ]
            );
            return resultado;
        } catch (erro) {
            console.error("Erro no create:", erro);
            return null;
        }
    },

    // Atualizar dados do usuário
    update: async (usuario, id_usuario) => {
        try {
            const [resultado] = await pool.query(
                `UPDATE usuario SET 
                    nome_usuario = ?,
                    email_usuario = ?,
                    telefone_usuario = ?,
                    cep_usuario = ?,
                    numero_usuario = ?,
                    complemento_usuario = ?,
                    img_perfil_pasta = ?,
                    img_perfil_banco = ?,
                    senha_usuario = ?
                WHERE id_usuario = ?`,
                [
                    usuario.nome_usuario,
                    usuario.email_usuario,
                    usuario.telefone_usuario,
                    usuario.cep_usuario,
                    usuario.numero_usuario,
                    usuario.complemento_usuario,
                    usuario.img_perfil_pasta,
                    usuario.img_perfil_banco,
                    usuario.senha_usuario || null,
                    id_usuario
                ]
            );
            return resultado;
        } catch (erro) {
            console.error("Erro no update:", erro);
            return null;
        }
    },

    // Desativar usuário (soft delete)
    softDelete: async (id_usuario) => {
        try {
            const [resultado] = await pool.query(
                `UPDATE usuario SET status_usuario = 0 WHERE id_usuario = ?`,
                [id_usuario]
            );
            return resultado;
        } catch (erro) {
            console.error("Erro no softDelete:", erro);
            return null;
        }
    }
};

module.exports = usuarioModel;
