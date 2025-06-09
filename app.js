const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require('path');
const dotenv = require("dotenv");

const app = express();

dotenv.config();

// Initialize flash
app.use(flash());

// Sessão
app.use(session({
    secret: "chaveparacriptografia",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware de arquivos estáticos
app.use(express.static(path.join(__dirname, 'app/public')));

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", "./app/views");

// Middleware de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROTAS
const rotaPrincipal = require("./app/routes/router")();
app.use("/", rotaPrincipal);

// Rotas do aluno
const alunoRoutes = require('./app/routes/aluno');
app.use('/aluno', alunoRoutes);

// Rotas do profissional
const profissionalRoutes = require('./app/routes/profissional');
app.use('/profissional', profissionalRoutes);

app.listen(process.env.APP_PORT || 3000, () => {
    console.log(`Servidor rodando em http://localhost:${process.env.APP_PORT || 3000}`);
});

process.on('exit', () => {
    console.log("⚠️ Servidor finalizado inesperadamente.");
});