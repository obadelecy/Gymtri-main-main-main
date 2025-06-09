const bcrypt = require('bcryptjs')
const academiaModel = require('../models/academiaModel.js')
const { body, validationResult } = require("express-validator");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const https = require("https");
const { createPool } = require("mysql2");
const salt = bcrypt.genSaltSync(10)

const academiaController = {
    // Buscar academias por termo (autocomplete)
    buscarAcademias: async (req, res) => {
        try {
            const { termo } = req.query;
            if (!termo || termo.length < 2) {
                return res.json([]);
            }
            const academias = await academiaModel.buscarPorNome(termo);
            res.json(academias);
        } catch (error) {
            console.error('Erro ao buscar academias:', error);
            res.status(500).json({ error: 'Erro ao buscar academias' });
        }
    },

    // Listar todas as academias ativas
    listarAcademias: async (req, res) => {
        try {
            const academias = await academiaModel.listarAtivas();
            res.render('pages/Aluno/buscarAcademia', { 
                academias,
                usuario: req.session.autenticado || {},
                flash: req.flash() || {}
            });
        } catch (error) {
            console.error('Erro ao listar academias:', error);
            req.flash('error', 'Erro ao carregar a lista de academias');
            res.redirect('/aluno/interfaceUsuario');
        }
    },

    // Visualizar detalhes de uma academia
    visualizarAcademia: async (req, res) => {
        try {
            const { id } = req.params;
            const academia = await academiaModel.findById(id);
            
            if (!academia) {
                req.flash('error', 'Academia não encontrada');
                return res.redirect('/aluno/buscarAcademia');
            }
            
            res.render('pages/Aluno/detalhesAcademia', { 
                academia,
                usuario: req.session.autenticado || {},
                flash: req.flash() || {}
            });
        } catch (error) {
            console.error('Erro ao visualizar academia:', error);
            req.flash('error', 'Erro ao carregar os dados da academia');
            res.redirect('/aluno/buscarAcademia');
        }
    },

    // Validação

    // Validação
    validacaoFormularioCadastro: [
        body('nome')
            .isLength({ min: 3, max: 45 })
            .withMessage('O nome deve ter de 3 a 45 letras'),
        body('email')
            .isEmail()
            .withMessage('O e-mail deve ser válido!'),
        body('senha')
            .isStrongPassword()
            .withMessage('A senha deve possuir no mínimo 8 caracteres: com letra miniscula, maiuscula, numeral e caracter especial!'),
        body('c-senha')
            .custom((value, { req }) => {
                if (value != req.body.senha) {
                    throw new Error('Senha está errada')
                } else {
                    return true;
                }
            })
    ],

    regrasValidacaoFormLogin: [
        body('nome')
            .isLength({ min: 3, max: 45 })
            .withMessage('O nome da academia / e-mail deve conter de 8 a 45 caracteres.'),
        body('senha')
            .isStrongPassword()
            .withMessage('A senha deve possuir no mínimo 8 caracteres, (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)')
    ],

    // Métodos existentes
    inserirAcademia: async (req, res) => {
        //recuperar dados da validação
        const listaErros = validationResult(req);
        //verificar se há erros
        if (listaErros.isEmpty()) {

        }
    },

    cadastrarAcademia: async (req, res) => {
        try {
            const {
                nameAcademyRegister,
                cpnjAcademyRegister,
                emailAcademyRegister,
                cellAcademyRegister,
                passwordAcademyRegister,
                cepAcad,
                ruaAcad,
                bairroAcad,
                cidadeAcad,
                ufAcad,
                numeroAcad,
                complementoAcad,
                capacityAcademyRegister,
                // hourAcademyRegister,
                hourAcademyRegisterAb,
                hourAcademyRegisterEnc,
                musculacao,
                crossfit,
                cardio,
                lutas,
                danca,
                gisnastica,
                natacao,
                pilates,
                yoga
            } = req.body;


            if (!nameAcademyRegister || !emailAcademyRegister || !passwordAcademyRegister || !cellAcademyRegister) {
                console.log(cellAcademyRegister)
                console.log(nameAcademyRegister)
                console.log(emailAcademyRegister)
                console.log(passwordAcademyRegister)
                return res.status(400).send("Todos os campos são obrigatórios.");
            }

            const senhaCriptografada = bcrypt.hashSync(passwordAcademyRegister, salt);

            const novaAcademia = {
                CNPJ: cpnjAcademyRegister,
                NOME_ACADEMIA: nameAcademyRegister,
                EMAIL: emailAcademyRegister,
                SENHA: senhaCriptografada,
                TELEFONE: cellAcademyRegister,
                BAIRRO: bairroAcad,
                CIDADE: cidadeAcad,
                RUA: ruaAcad,
                UF: ufAcad
            };

            console.log("✅ Aluno pronto para ser salvo:", novaAcademia);
            let insert = await academiaModel.create(novaAcademia)

            // aqui entraremos com o banco (veja abaixo)

            res.status(201).send("Academia cadastrada com sucesso!");
        } catch (err) {
            console.error("Erro ao cadastrar academia:", err);
            res.status(500).send("Erro interno no servidor");
        }
    },

    // Listar todos os usuários
    listaAcademia: async (req, res) => {
        try {
            const Academias = await academiaModel.findAll();
            res.render("pages/Academia", { Academias });
        } catch (erro) {
            console.error("Erro ao buscar academias:", erro);
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
        body("NUMERO_ENDERECO")
            .isNumeric()
            .withMessage("Digite um número para o endereço!"),
        // verificarAlunoAtualizado(...) função precisa ser definida/importada se for usada
    ],

    // Exibir o perfil da academia
    mostrarPerfilAcad: async (req, res) => {
        try {
            let results = await academiaModel.findId(req.session.autenticado.id);
            let viacreatePool = { createPool: "", RUA: "", NUMERO: "", COMPLEMENTO: "" };
            let createPool = null;

            if (results[0].createPool_Academia) {
                const httpsAgent = new https.Agent({ rejectUnauthorized: false });
                const response = await fetch(`https://viacreatePool.com.br/ws/${results[0].createPool_Academia}/json/`, {
                    method: "GET",
                    headers: null,
                    body: null,
                    agent: httpsAgent,
                });
                viacreatePool = await response.json();
                createPool = results[0].createPool_Academia.slice(0, 5) + "-" + results[0].createPool_Academia.slice(5);
            }

            const campos = {
                NOME: results[0].NOME,
                EMAIL: results[0].EMAIL,
                TELEFONE: results[0].TELEFONE,
                createPool: createPool,
                NUMERO_ENDERECO: results[0].NUMERO_ENDERECO,
                COMPLEMENTO: results[0].COMPLEMENTO,
                RUA: viacreatePool.RUA,
                BAIRRO: viacreatePool.BAIRRO,
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
                    NUMERO_ENDERECO: "",
                    COMPLEMENTO: "",
                    RUA: "",
                    BAIRRO: "",
                    img_perfil_banco: "",
                    img_perfil_pasta: "",
                },
            });
        }
    },

// Gravar alterações do perfil
  gravarPerfilAcad: async (req, res) => {
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
      let academia = {
        NOME: req.body.NOME,
        EMAIL: req.body.EMAIL,
        TELEFONE: req.body.TELEFONE,
        createPool_Academia: req.body.createPool.replace("-", ""),
        NUMERO_ENDERECO: req.body.NUMERO_ENDERECO,
        COMPLEMENTO: req.body.COMPLEMENTO,
        img_perfil_banco: req.session.autenticado.img_perfil_banco,
        img_perfil_pasta: req.session.autenticado.img_perfil_pasta,
      };

      if (req.body.SENHA !== "") {
        academia.SENHA = bcrypt.hashSync(req.body.SENHA, salt);
      }

      if (req.file) {
        const caminhoArquivo = "publico/img" + req.file.filename;
        if (academia.img_perfil_pasta !== caminhoArquivo) {
          removeImg(academia.img_perfil_pasta);
        }
        academia.img_perfil_pasta = caminhoArquivo;
        academia.img_perfil_banco = req.file.buffer;
        removeImg(academia.img_perfil_pasta);
        academia.img_perfil_pasta = null;
      }

      const resultUpdate = await academiaModel.update(academia, req.session.autenticado.id);

      if (resultUpdate && resultUpdate.changedRows === 1) {
        const result = await academiaModel.findId(req.session.autenticado.id);
        const autenticado = {
          autenticado: result[0].NOME_COMPLETO,
          id: result[0].id_Academia,
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
          NUMERO_ENDERECO: result[0].NUMERO_ENDERECO,
          COMPLEMENTO: result[0].COMPLEMENTO,
          RUA: "",
          BAIRRO: "",
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
          valores: academia,
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
  }
};

// Exporta o controller
module.exports = academiaController;
