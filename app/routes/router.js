const express = require("express");

module.exports = function(application) {
  const router = express.Router();

  const alunoController = require("../controllers/alunoController");
  const academiaController = require("../controllers/academiaController");
  const profisController = require("../controllers/profisController");
  const agendamentosController = require("../controllers/agendamentosController");
  const buscaController = require("../controllers/buscaController");
  const profisModel = require("../models/profisModel");
  const academiaRouter = require("./academia");

  const {
    verificarUsuAutenticado,
    limparSessao,
    gravarUsuAutenticado,
    verificarUsuAutorizado
  } = require("../models/autenticador_middleware");

  router.get("/", (req, res) => {
    res.render("pages/index");
  });

  router.get("/login", (req, res) => {
    res.render("pages/login", { falha: null, listaErros: null });
  });

  router.get("/cadastro", (req, res) => {
    res.render("pages/cadastro", {
      valores: {
        cep: "",
        logradouro: "",
        bairro: "",
        cidade: "",
        uf: "",
        numero: "",
        complemento: ""
      }
    });
  });

  router.get("/produtos", (req, res) => {
    res.render("pages/produtos");
  });

  // Rota de login que usa o middleware gravarUsuAutenticado para autenticar o usuário
  // e depois chama o método logar do alunoController para renderizar a interface correta
  router.post("/loginInterface", gravarUsuAutenticado, alunoController.logar);

  // Academia Routes
  router.use('/academia', academiaRouter);

  // Rota para a interface do profissional
  router.get("/profissional/interface", verificarUsuAutenticado, (req, res) => {
    if (req.session.autenticado && req.session.autenticado.tipo === 'profissional') {
      res.render('pages/interfaces/interfaceProfissional', { 
        usuario: req.session.autenticado || {},
        flash: req.flash() || {}
      });
    } else {
      res.redirect('/login');
    }
  });

  // Rota para a interface da academia
  router.get("/academia/interface", verificarUsuAutenticado, (req, res) => {
    if (req.session.autenticado && req.session.autenticado.tipo === 'academia') {
      res.render('pages/interfaces/interfaceAcademia', { 
        usuario: req.session.autenticado || {},
        flash: req.flash() || {}
      });
    } else {
      res.redirect('/login');
    }
  });

  // Rota para a interface do usuário
  router.get("/interfaceUsuario", verificarUsuAutenticado, (req, res) => {
    res.render('pages/interfaces/interfaceUsuario', { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {}
    });
  });

  router.get("/aluno/agendamento", verificarUsuAutenticado, (req, res) => {
    agendamentosController.listarAgendamentos(req, res);
  });

  router.get("/aluno/novoAgendamento", verificarUsuAutenticado, (req, res) => {
    agendamentosController.novoAgendamento(req, res);
  });

  router.get("/aluno/relatorio", verificarUsuAutenticado, (req, res) => {
    res.render("pages/Aluno/relatorio", { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      relatorios: []
    });
  });

  router.get("/aluno/saude", verificarUsuAutenticado, (req, res) => {
    res.render("pages/Aluno/saude", { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      posts: []
    });
  });

  router.get("/aluno/treinos", verificarUsuAutenticado, (req, res) => {
    res.render("pages/Aluno/treinos", { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      treinos: []
    });
  });

  // Rotas de aluno foram movidas para aluno.js
  // Incluindo: /editarDados, /atualizarDados, /excluirConta

  // Rota para exibir a página de busca de profissionais
  // Rota para exibir a página de busca de profissionais
  router.get("/aluno/buscarProfissional", verificarUsuAutenticado, async (req, res) => {
    try {
      const profissionais = await profisModel.listarAtivos();
      res.render("pages/Aluno/buscarProfissional", { 
        profissionais: profissionais || [],
        usuario: req.session.autenticado || {},
        flash: req.flash() || {}
      });
    } catch (error) {
      console.error('Erro ao carregar página de busca de profissionais:', error);
      req.flash('error', 'Erro ao carregar a página de busca de profissionais');
      res.redirect('/aluno/interfaceUsuario');
    }
  });
  
  // Rota para busca de profissionais (autocomplete)
  router.get('/api/profissionais/buscar', verificarUsuAutenticado, buscaController.buscarProfissionais);
  
  // Rota para listar todos os profissionais (API)
  router.get('/api/profissionais', verificarUsuAutenticado, buscaController.listarProfissionais);

  // Rota para listar academias
  router.get("/aluno/buscarAcademia", verificarUsuAutenticado, academiaController.listarAcademias);
  
  // Rota para API de busca de academias (autocomplete)
  router.get("/api/academias/buscar", verificarUsuAutenticado, academiaController.buscarAcademias);
  
  // Rota para visualizar detalhes de uma academia
  router.get("/aluno/academia/:id", verificarUsuAutenticado, academiaController.visualizarAcademia);
  
  // Rota para processar a busca de profissionais
  router.post("/buscar-profissional", verificarUsuAutenticado, async (req, res) => {
    try {
      const { search } = req.body;
      
      // Aqui você deve adicionar a lógica para buscar os profissionais no banco de dados
      // Por enquanto, estou retornando um array vazio
      const profissionais = [];
      
      res.render("pages/Aluno/buscarProfissional", { 
        profissionais,
        search,
        usuario: req.session.autenticado || {},
        flash: req.flash() || {}
      });
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      req.flash('error', 'Erro ao buscar profissionais. Por favor, tente novamente.');
      res.redirect('/aluno/buscarProfissional');
    }
  });

  router.post(
    '/Aluno/createAgend',
    agendamentosController.regrasValidacao,
    (req, res) => {
      agendamentosController.criarAgendamento(req, res);
    }
  );
  router.post("/aluno", alunoController.cadastrarAluno);
  router.post("/academia", academiaController.cadastrarAcademia);
  router.post("/profissional", profisController.cadastrarProfis);
  router.post("/createAgend", agendamentosController.criarAgendamento);
  return router;
};
