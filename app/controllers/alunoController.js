// controllers/AlunoController.js

const alunoModel = require("../models/alunoModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(12);
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const https = require("https");
const { createPool } = require("mysql2");

// Função auxiliar para validação de CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/[\D]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
}

const alunoController = {

  cadastrarAluno: async (req, res) => {
    console.log('Recebendo requisição de cadastro:', req.body);
    
    try {
      const {
        fullname,
        emailRegister,
        passwordRegister,
        passwordRegisterConfirm,
        numberRegister,
        dataNasc,
        cep,
        rua,
        bairro,
        cidade,
        uf,
        numero,
        complemento,
        cpfRegister,
        cvvValidation,
        numberCardRegister,
        nameCardRegister,
        validityDate,
        plans
      } = req.body;

      // Validações básicas
      if (!fullname || !emailRegister || !passwordRegister || !numberRegister || !cpfRegister) {
        console.log('Campos obrigatórios não preenchidos');
        return res.status(400).json({ 
          success: false, 
          message: 'Por favor, preencha todos os campos obrigatórios.',
          missingFields: {
            fullname: !fullname,
            emailRegister: !emailRegister,
            passwordRegister: !passwordRegister,
            numberRegister: !numberRegister,
            cpfRegister: !cpfRegister
          }
        });
      }


      if (passwordRegister !== passwordRegisterConfirm) {
        console.log('Senhas não coincidem');
        return res.status(400).json({ 
          success: false, 
          message: 'As senhas não coincidem.' 
        });
      }
      
      if (!validateCPF(cpfRegister)) {
        console.log('CPF inválido');
        return res.status(400).json({
          success: false,
          message: 'CPF inválido. Por favor, verifique o número.'
        });
      }

      // Criptografa a senha
      const senhaCriptografada = await bcrypt.hash(passwordRegister, 10);

      const novoAluno = {
        NOME_COMPLETO: fullname,
        EMAIL: emailRegister,
        SENHA: senhaCriptografada,
        TELEFONE: numberRegister,
        BAIRRO: bairro,
        CEP: cep,
        CIDADE: cidade,
        UF: uf,
        NUMERO: numero,
        COMPLEMENTO: complemento || null,
        CPF: cpfRegister.replace(/[\D]/g, ''), // Remove formatação do CPF
        DATA_DE_NASCIMENTO: dataNasc || null,
        // Campos opcionais de cartão
        CVV: cvvValidation || null,
        NUMERO_DO_CARTAO: numberCardRegister || null,
        NOME_CARTAO: nameCardRegister,
        RUA: rua,
        VALIDADE: validityDate
      };

      console.log("✅ Aluno pronto para ser salvo:", novoAluno);
      let insert = await alunoModel.create(novoAluno)

      // aqui entraremos com o banco (veja abaixo)

      res.status(201).send("Aluno cadastrado com sucesso!");
    } catch (err) {
      console.error("Erro ao cadastrar aluno:", err);
      res.status(500).send("Erro interno no servidor");
    }
  },



  // Listar todos os usuários
  listaAlunos: async (req, res) => {
    try {
      const Alunos = await alunoModel.findAll();
      res.render("pages/Alunos", { Alunos });
    } catch (erro) {
      console.error("Erro ao buscar usuários:", erro);
      res.status(500).send("Erro no servidor");
    }
  },

  // Validações para atualização de perfil
  regrasValidacaoPerfil: [
    body("NOME_COMPLETO")
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
    body("NUMERO")
      .isNumeric()
      .withMessage("Digite um número para o endereço!"),
    // verificarAlunoAtualizado(...) função precisa ser definida/importada se for usada
  ],

  regrasValidacaoFormLogin: [
    body("nome")
      .isLength({ min: 8, max: 45 })
      .withMessage("O e-mail deve ter de 8 a 45 caracteres"),
    body("senha")
      .isStrongPassword()
      .withMessage("A senha deve ter no mínimo 8 caracteres (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)")
  ],

  logar: (req, res) => {
    console.log('=== alunoController.logar ===');
    console.log('Session data:', req.session.autenticado);
    
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      console.log('Validation errors:', erros.array());
      return res.render("pages/login", { 
        listaErros: erros, 
        dadosNotificacao: null 
      });
    }
    
    if (req.session.autenticado && req.session.autenticado.autenticado === true) {
      // Redireciona para a rota correta com base no tipo de usuário
      const tipo = req.session.autenticado.tipo;
      console.log(`Redirecionando usuário do tipo: ${tipo}`);
      
      let redirectUrl = '/login';
      
      switch(tipo) {
        case 'aluno':
          redirectUrl = '/interfaceUsuario';
          break;
        case 'academia':
          redirectUrl = '/academia/interface';
          break;
        case 'profissional':
          redirectUrl = '/profissional/interface';
          break;
        default:
          console.log('Tipo de usuário desconhecido:', tipo);
          return res.render("pages/login", {
            listaErros: null,
            dadosNotificacao: { 
              titulo: "Erro!", 
              mensagem: "Tipo de usuário não suportado.", 
              tipo: "error" 
            }
          });
      }
      
      console.log(`Redirecionando para: ${redirectUrl}`);
      
      // Força o salvamento da sessão antes do redirecionamento
      req.session.save(function(err) {
        if (err) {
          console.error('Erro ao salvar a sessão:', err);
          return res.redirect('/login');
        }
        // Usa res.redirect com status 302 para garantir o redirecionamento
        res.status(302).location(redirectUrl).end();
      });
      
      return;
    }
    
    console.log('Falha na autenticação - sessão inválida ou usuário não autenticado');
    // Se chegou até aqui, houve algum erro na autenticação
    res.render("pages/login", {
      listaErros: null,
      dadosNotificacao: { 
        titulo: "Falha ao logar!", 
        mensagem: "Usuário e/ou senha inválidos!", 
        tipo: "error" 
      }
    });
  },

  // Exibir o perfil do usuário
  mostrarPerfil: async (req, res) => {
    try {
      let results = await alunoModel.findId(req.session.autenticado.id);
      let viacreatePool = { createPool: "", RUA: "", NUMERO: "", COMPLEMENTO: "" };
      let createPool = null;

      if (results[0].createPool_Aluno) {
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const response = await fetch(`https://viacreatePool.com.br/ws/${results[0].createPool_Aluno}/json/`, {
          method: "GET",
          headers: null,
          body: null,
          agent: httpsAgent,
        });
        viacreatePool = await response.json();
        createPool = results[0].createPool_Aluno.slice(0, 5) + "-" + results[0].createPool_Aluno.slice(5);
      }

      const campos = {
        NOME_COMPLETO: results[0].NOME_COMPLETO,
        EMAIL: results[0].EMAIL,
        TELEFONE: results[0].TELEFONE,
        createPool: createPool,
        NUMERO: results[0].NUMERO,
        COMPLEMENTO: results[0].COMPLEMENTO,
        RUA: viacreatePool.RUA,
        BAIRRO: viacreatePool.BAIRRO,
        //localidade: viacreatePool.localidade,
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
          NOME_COMPLETO: "",
          EMAIL: "",
          TELEFONE: "",
          SENHA: "",
          createPool: "",
          NUMERO: "",
          COMPLEMENTO: "",
          RUA: "",
          BAIRRO: "",
          //localidade: "",
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
      let aluno = {
        NOME_COMPLETO: req.body.NOME_COMPLETO,
        EMAIL: req.body.EMAIL,
        TELEFONE: req.body.TELEFONE,
        createPool_Aluno: req.body.createPool.replace("-", ""),
        NUMERO: req.body.NUMERO,
        COMPLEMENTO: req.body.COMPLEMENTO,
        img_perfil_banco: req.session.autenticado.img_perfil_banco,
        img_perfil_pasta: req.session.autenticado.img_perfil_pasta,
      };

      if (req.body.SENHA !== "") {
        aluno.SENHA = bcrypt.hashSync(req.body.SENHA, salt);
      }

      if (req.file) {
        const caminhoArquivo = "publico/img" + req.file.filename;
        if (aluno.img_perfil_pasta !== caminhoArquivo) {
          removeImg(aluno.img_perfil_pasta);
        }
        aluno.img_perfil_pasta = caminhoArquivo;
        aluno.img_perfil_banco = req.file.buffer;
        removeImg(aluno.img_perfil_pasta);
        aluno.img_perfil_pasta = null;
      }

      const resultUpdate = await alunoModel.update(aluno, req.session.autenticado.id);

      if (resultUpdate && resultUpdate.changedRows === 1) {
        const result = await alunoModel.findId(req.session.autenticado.id);
        const autenticado = {
          autenticado: result[0].NOME_COMPLETO,
          id: result[0].id_Aluno,
          tipo: result[0].tipo,
          img_perfil_banco:
            result[0].img_perfil_banco != null
              ? `data:image/jpeg;base64,${result[0].img_perfil_banco.toString("base64")}`
              : null,
          img_perfil_pasta: result[0].img_perfil_pasta,
        };
        req.session.autenticado = autenticado;

        const campos = {
          NOME_COMPLETO: result[0].NOME_COMPLETO,
          EMAIL: result[0].EMAIL,
          TELEFONE: result[0].TELEFONE,
          createPool: req.body.createPool,
          NUMERO: result[0].NUMERO,
          COMPLEMENTO: result[0].COMPLEMENTO,
          RUA: "",
          BAIRRO: "",
          //localidade: "",
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
          valores: aluno,
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

module.exports = alunoController;