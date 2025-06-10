const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');
const { verificarUsuAutenticado } = require('../models/autenticador_middleware');

// Middleware para verificar se o usuário é um profissional
const isProfissional = (req, res, next) => {
  if (req.session.autenticado && req.session.autenticado.tipo === 'profissional') {
    return next();
  }
  res.redirect('/login');
};

// Rota para a interface do profissional
router.get('/interface', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/interfaces/interfaceProfissional', { 
    usuario: req.session.autenticado || {},
    flash: req.flash() || {}
  });
});

// Rota para a agenda do profissional
router.get('/agenda', verificarUsuAutenticado, isProfissional, (req, res) => {
  agendamentosController.listarAgendamentosProfissional(req, res);
});

// Rota para buscar alunos
router.get('/buscar-aluno', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/buscarAluno', {
    usuario: req.session.autenticado || {}
  });
});

// Rota para atividades
router.get('/atividades', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/atividadeCriada', {
    usuario: req.session.autenticado || {}
  });
});

// Rota para relatórios
router.get('/relatorios', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/relatorioCriado', {
    usuario: req.session.autenticado || {}
  });
});

// Rota para editar dados
router.get('/editar-dados', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/editarDados', {
    usuario: req.session.autenticado || {}
  });
});

// Rota para gerar atividade
router.get('/gerar-atividade', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/gerarAtividade', {
    usuario: req.session.autenticado || {}
  });
});

// Rota para gerar relatório
router.get('/gerar-relatorio', verificarUsuAutenticado, isProfissional, (req, res) => {
  res.render('pages/Profissional/gerarRelatorio', {
    usuario: req.session.autenticado || {}
  });
});

module.exports = router;
