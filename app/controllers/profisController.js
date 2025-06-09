// controllers/profisController.js
const profisModel = require("../models/profisModel.js");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(12);
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const https = require("https");
const { createPool } = require("mysql2");
 
const profisController = {
  cadastrarProfis: async (req, res) => {
    try {
        // Log detalhado dos dados recebidos
        console.log('Dados recebidos no controller:', req.body);
        
        // Verificar se o corpo da requisição existe
        if (!req.body) {
            return res.status(400).json({
                success: false,
                errors: [
                    { msg: "Corpo da requisição vazio." }
                ]
            });
        }

        // Extração segura dos dados
        const dados = {
            fullname: req.body.fullname || '',
            emailRegister: req.body.emailRegister || '',
            passwordRegister: req.body.passwordRegister || '',
            passwordRegisterConfirm: req.body.passwordRegisterConfirm || '',
            numberRegister: req.body.numberRegister || '',
            numberDoc: req.body.numberDoc || '',
            profession: req.body.profession || '',
            profissionalReg: req.body.profissionalReg || ''
        };

        // Validar se todos os campos obrigatórios existem e não estão vazios
        const camposObrigatorios = ['fullname', 'emailRegister', 'passwordRegister', 'numberRegister', 'numberDoc'];
        const erros = camposObrigatorios.map(campo => {
            if (!dados[campo] || dados[campo].trim() === '') {
                return `Campo ${campo} é obrigatório.`;
            }
            return null;
        }).filter(erro => erro !== null);

        if (erros.length > 0) {
            return res.status(400).json({
                success: false,
                errors: erros
            });
        }

        // Validar confirmação de senha
        if (dados.passwordRegister !== dados.passwordRegisterConfirm) {
            return res.status(400).json({
                success: false,
                errors: [
                    { msg: "As senhas não coincidem." }
                ]
            });
        }

        // Verificar se o email já existe
        const [existingProfis] = await profisModel.findProfisByEmail(dados.emailRegister);
        if (existingProfis && existingProfis.length > 0) {
            return res.status(400).json({
                success: false,
                errors: [
                    { msg: "Este e-mail já está cadastrado." }
                ]
            });
        }

        // Criptografar senha
        const senhaCriptografada = bcrypt.hashSync(dados.passwordRegister, salt);

        // Montar objeto com dados do profissional
        const novoProfis = {
            NOME: dados.fullname,
            NUMERO_DOC: dados.numberDoc,
            EMAIL: dados.emailRegister,
            SENHA: senhaCriptografada,
            TELEFONE: dados.numberRegister,
            CPF_PROF: dados.numberDoc, // Usando o mesmo número do documento como CPF_PROF
            PROFISSAO: dados.profession,
            REGISTRO_PROFISSIONAL: dados.profissionalReg
        };

        console.log("✅ Profissional pronto para ser salvo:", novoProfis);

        // Salvar no banco
        await profisModel.create(novoProfis);

        // Redirecionar para a página de login
        return res.redirect('/login');

    } catch (err) {
        console.error("Erro ao cadastrar Profissional:", err);
        return res.status(500).json({
            success: false,
            errors: [
                { msg: "Erro interno no servidor." }
            ]
        });
    }
},
 
 
 
  // Listar todos os usuários
  listaProfis: async (req, res) => {
    try {
      const profis = await profisModel.findAll();
      res.render("pages/profiss", { profis });
    } catch (erro) {
      console.error("Erro ao buscar profissional:", erro);
      res.status(500).send("Erro no servidor");
    }
  },
 
  // Validações para atualização de perfil
  regrasValidacaoPerfil: [
    body("NOME")
      .isLength({ min: 3, max: 45 })
      .withMessage("Nome deve ter de 3 a 45 caracteres!"),
    body("EMAIL")
      .isEmail()
      .withMessage("Digite um e-mail válido!"),
    body("TELEFONE")
      .isLength({ min: 12, max: 15 })
      .withMessage("Digite um telefone válido!"),
    body("createPool")
      .isPostalCode("BR")
      .withMessage("Digite um createPool válido!"),
    // verificarprofisAtualizado(...) função precisa ser definida/importada se for usada
  ],
 
  // Exibir o perfil do profissional
  mostrarPerfil: async (req, res) => {
    try {
      let results = await profisModel.findId(req.session.autenticado.id);
      let viacreatePool = { createPool: "", RUA: "", NUMERO: "", COMPLEMENTO: "" };
      let createPool = null;
 
      if (results[0].createPool_profis) {
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const response = await fetch(`https://viacreatePool.com.br/ws/${results[0].createPool_profis}/json/`, {
          method: "GET",
          headers: null,
          body: null,
          agent: httpsAgent,
        });
        viacreatePool = await response.json();
        createPool = results[0].createPool_profis.slice(0, 5) + "-" + results[0].createPool_profis.slice(5);
      }
 
      const campos = {
        NOME: results[0].NOME,
        EMAIL: results[0].EMAIL,
        TELEFONE: results[0].TELEFONE,
        createPool: createPool,
        img_perfil_pasta: results[0].img_perfil_pasta,
        img_perfil_banco:
          results[0].img_perfil_banco != null
            ? `data:image/jpeg;base64,${results[0].img_perfil_banco.toString("base64")}`
            : null,
      };
 
      res.render("pages/perfil", {
        listaErros: null,
        dadosNotificacao: null,
        valores: campos,
      });
    } catch (e) {
      console.log(e);
      res.render("pages/perfil", {
        listaErros: null,
        dadosNotificacao: null,
        valores: {
          NOME: "",
          EMAIL: "",
          TELEFONE: "",
          SENHA: "",
          createPool: "",
          img_perfil_banco: "",
          img_perfil_pasta: "",
        },
      });
    }
  },
 
  // Gravar alterações do perfil
  gravarPerfil: async (req, res) => {
    const erros = validationResult(req);
    const erroMulter = req.session.erroMulter;
 
    if (!erros.isEmpty() || erroMulter != null) {
      const lista = !erros.isEmpty() ? erros : { formatter: null, errors: [] };
      if (erroMulter) lista.errors.push(erroMulter);
 
      return res.render("pages/perfil", {
        listaErros: lista,
        dadosNotificacao: null,
        valores: req.body,
      });
    }
 
    try {
      let profis = {
        NOME: req.body.NOME,
        EMAIL: req.body.EMAIL,
        TELEFONE: req.body.TELEFONE,
        createPool_profis: req.body.createPool.replace("-", ""),
        img_perfil_banco: req.session.autenticado.img_perfil_banco,
        img_perfil_pasta: req.session.autenticado.img_perfil_pasta,
      };
 
      if (req.body.SENHA !== "") {
        profis.SENHA = bcrypt.hashSync(req.body.SENHA, salt);
      }
 
      if (req.file) {
        const caminhoArquivo = "publico/img" + req.file.filename;
        if (profis.img_perfil_pasta !== caminhoArquivo) {
          removeImg(profis.img_perfil_pasta);
        }
        profis.img_perfil_pasta = caminhoArquivo;
        profis.img_perfil_banco = req.file.buffer;
        removeImg(profis.img_perfil_pasta);
        profis.img_perfil_pasta = null;
      }
 
      const resultUpdate = await profisModel.update(profis, req.session.autenticado.id);
 
      if (resultUpdate && resultUpdate.changedRows === 1) {
        const result = await profisModel.findId(req.session.autenticado.id);
        const autenticado = {
          autenticado: result[0].NOME,
          id: result[0].id_profis,
          tipo: result[0].tipo,
          img_perfil_banco:
            result[0].img_perfil_banco != null
              ? `data:image/jpeg;base64,${result[0].img_perfil_banco.toString("base64")}`
              : null,
          img_perfil_pasta: result[0].img_perfil_pasta,
        };
        req.session.autenticado = autenticado;
 
        const campos = {
          NOME: result[0].NOME,
          EMAIL: result[0].EMAIL,
          TELEFONE: result[0].TELEFONE,
          createPool: req.body.createPool,
          img_perfil_pasta: result[0].img_perfil_pasta,
          img_perfil_banco: result[0].img_perfil_banco,
          SENHA: "",
        };
 
        res.render("pages/perfil", {
          listaErros: null,
          dadosNotificacao: {
            titulo: "Perfil atualizado com sucesso!",
            mensagem: "Alterações gravadas",
            tipo: "Sucesso",
          },
          valores: campos,
        });
      } else {
        res.render("pages/perfil", {
          listaErros: null,
          dadosNotificacao: {
            titulo: "Perfil atualizado com sucesso!",
            mensagem: "Sem alterações",
            tipo: "Sucesso",
          },
          valores: profis,
        });
      }
    } catch (e) {
      console.log(e);
      res.render("pages/perfil", {
        listaErros: erros,
        dadosNotificacao: {
          titulo: "Erro ao atualizar o perfil!",
          mensagem: "Verifique os valores digitados!",
          tipo: "error",
        },
        valores: req.body,
      });
    }
  },
 
}
 
 
module.exports = profisController;