const express = require('express');
const router = express.Router();
const { verificarUsuAutenticado } = require("../models/autenticador_middleware");

// Middleware to verify if user is an academia
const isAcademia = (req, res, next) => {
    if (req.session.autenticado && req.session.autenticado.tipo === 'academia') {
        return next();
    }
    res.redirect('/login');
};

// Academia Interface
router.get('/interface', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/interfaces/interfaceAcademia');
});

// Academia Routes
router.get('/buscar-profissional', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/buscarProfissional');
});

router.get('/gerar-aula', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/gerarAula');
});

router.get('/agendamentos-geral', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/agendamentosGeral');
});

router.get('/treinos-aulas', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/treinosAulas');
});

router.get('/pendencias', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/pendencias');
});

router.get('/informacoes', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/informacoes');
});

router.get('/editar-dados', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/editarDados');
});

router.get('/visibilidade', verificarUsuAutenticado, isAcademia, (req, res) => {
    res.render('pages/Academia/visibilidade');
});

module.exports = router;
