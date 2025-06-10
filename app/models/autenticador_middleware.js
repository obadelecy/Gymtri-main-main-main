const { validationResult } = require("express-validator");
const aluno = require("./alunoModel");
const academia = require("./academiaModel");
const profisModel = require("./profisModel");
const bcrypt = require("bcryptjs");
const profissional = require("./profisModel")

const verificarUsuAutenticado = (req, res, next) => {
    console.log('=== MIDDLEWARE verificarUsuAutenticado ===');
    console.log('URL:', req.originalUrl);
    console.log('Método:', req.method);
    console.log('Sessão completa:', JSON.stringify(req.session, null, 2));
    
    // Check if session exists and has authentication data
    if (req.session && req.session.autenticado && req.session.autenticado.id) {
        console.log('Usuário autenticado:', JSON.stringify(req.session.autenticado, null, 2));
        // Update last activity timestamp
        req.session.lastActivity = Date.now();
        // Ensure autenticado object has required properties
        req.session.autenticado = {
            ...req.session.autenticado,
            autenticado: true
        };
        console.log('Sessão atualizada:', JSON.stringify(req.session.autenticado, null, 2));
        return next();
    }
    
    console.log('Usuário NÃO autenticado - Redirecionando para /login');
    // Store the original URL for redirect after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
};

limparSessao = (req, res, next) => {
    req.session.destroy();
    next();
};

gravarUsuAutenticado = async (req, res, next) => {
    const erros = validationResult(req);
    var autenticado = { autenticado: null, id: null, tipo: null };
    
    if (erros.isEmpty()) {
        // Mapeia o tipo de interface para o tipo de usuário
        const tipoMap = {
            'interfaceUsuario': 'aluno',
            'interfaceAcademia': 'academia',
            'interfaceProfissional': 'profissional'
        };
        
        const tipoUsuario = tipoMap[req.body.tipo] || '';
        const email = req.body.nome || req.body.email;
        const senha = req.body.senha;
        
        console.log(`Tentativa de login - Tipo: ${tipoUsuario}, Email: ${email}`);
        
        try {
            let results = [];
            
            // Busca o usuário com base no tipo
            if (tipoUsuario === 'aluno') {
                results = await aluno.findEmail(email);
            } else if (tipoUsuario === 'academia') {
                results = await academia.findEmail(email);
            } else if (tipoUsuario === 'profissional') {
                results = await profisModel.findEmail(email);
            }
            
            console.log(`Resultados da busca para ${tipoUsuario}:`, results);
            
            if (results && results.length === 1) {
                const usuario = results[0];
                console.log(`Verificando senha para: ${usuario.EMAIL}`);
                
                // Verifica se a senha fornecida corresponde ao hash no banco de dados
                const senhaValida = await bcrypt.compare(senha, usuario.SENHA);
                
                if (senhaValida) {
                    // Define os dados do usuário na sessão com base no tipo
                    if (tipoUsuario === 'aluno') {
                        autenticado = {
                            autenticado: true,
                            nome: usuario.NOME_COMPLETO,
                            id: usuario.CPF,
                            tipo: 'aluno',
                            email: usuario.EMAIL
                        };
                    } else if (tipoUsuario === 'academia') {
                        autenticado = {
                            autenticado: true,
                            nome: usuario.nome || 'Academia',
                            id: usuario.id, // CNPJ
                            tipo: 'academia',
                            email: usuario.EMAIL
                        };
                    } else if (tipoUsuario === 'profissional') {
                        autenticado = {
                            autenticado: true,
                            nome: usuario.NOME,
                            id: usuario.NUMERO_DOC,
                            tipo: 'profissional',
                            email: usuario.EMAIL
                        };
                    }
                    
                    console.log('Usuário autenticado com sucesso:', autenticado);
                    
                    // Salva a sessão antes de continuar
                    req.session.autenticado = autenticado;
                    req.session.logado = 1;
                    
                    // Salva a sessão e continua para o próximo middleware
                    req.session.save(function(err) {
                        if (err) {
                            console.error('Erro ao salvar a sessão:', err);
                            return next(err);
                        }
                        next();
                    });
                    return; // Importante: não continuar a execução
                } else {
                    console.log('Senha inválida para o usuário:', usuario.EMAIL);
                }
            } else {
                console.log(`Nenhum ${tipoUsuario} encontrado para o email:`, email);
            }
        } catch (erro) {
            console.error('Erro durante a autenticação:', {
                message: erro.message,
                stack: erro.stack,
                code: erro.code,
                sqlMessage: erro.sqlMessage
            });
            return next(erro);
        }
    } else {
        console.log('Erros de validação no formulário:', erros.array());
    }
    
    // Se chegou até aqui, a autenticação falhou
    req.session.autenticado = { autenticado: false };
    req.session.logado = 0;
    next();
};

verificarUsuAutorizado = (tipoPermitido, destinoFalha) => {
    return (req, res, next) => {
        if (
            req.session.autenticado.autenticado != null &&
            tipoPermitido.find(function (element) {
                return element == req.session.autenticado.tipo;
            }) != undefined
        ) {
            next();
        } else {
            res.render(destinoFalha, req.session.autenticado);
        }
    };
};

module.exports = {
    verificarUsuAutenticado,
    limparSessao,
    gravarUsuAutenticado,
    verificarUsuAutorizado,
};
