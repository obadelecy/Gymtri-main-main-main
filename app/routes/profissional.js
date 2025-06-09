const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');
const { verificarUsuAutenticado } = require('../models/autenticador_middleware');

// Rota para a interface do profissional
router.get('/interface', verificarUsuAutenticado, (req, res) => {
  if (req.session.autenticado && req.session.autenticado.tipo === 'profissional') {
    res.render('pages/interfaces/interfaceProfissional', { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {}
    });
  } else {
    res.redirect('/login');
  }
});

// Rota para a agenda do profissional
router.get('/agenda', verificarUsuAutenticado, (req, res) => {
  if (req.session.autenticado && req.session.autenticado.tipo === 'profissional') {
    agendamentosController.listarAgendamentosProfissional(req, res);
  } else {
    res.redirect('/login');
  }
});

// Outras rotas do profissional podem ser adicionadas aqui

module.exports = router;
