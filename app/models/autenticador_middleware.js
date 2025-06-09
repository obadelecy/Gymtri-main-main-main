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
    
    if (req.session.autenticado) {
        console.log('Usuário autenticado:', JSON.stringify(req.session.autenticado, null, 2));
        var autenticado = req.session.autenticado;
        req.session.logado = (req.session.logado || 0) + 1;
        console.log('Contador de logins:', req.session.logado);
    } else {
        console.log('Usuário NÃO autenticado');
        var autenticado = { autenticado: null, id: null, tipo: null };
        req.session.logado = 0;
    }
    
    req.session.autenticado = autenticado;
    console.log('Dados da sessão após verificação:', JSON.stringify(req.session, null, 2));
    console.log('=== FIM MIDDLEWARE verificarUsuAutenticado ===');
    next();
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
                            autenticado: usuario.NOME_COMPLETO,
                            id: usuario.CPF,
                            tipo: 'aluno',
                            email: usuario.EMAIL
                        };
                    } else if (tipoUsuario === 'academia') {
                        autenticado = {
                            autenticado: usuario.nome, // Usa o nome da academia
                            id: usuario.id, // Usa CNPJ como ID (retornado como id na consulta)
                            tipo: 'academia',
                            email: usuario.EMAIL
                        };
                    } else if (tipoUsuario === 'profissional') {
                        autenticado = {
                            autenticado: usuario.NOME, // Nome do profissional
                            id: usuario.NUMERO_DOC, // Usa NUMERO_DOC como ID
                            tipo: 'profissional',
                            email: usuario.EMAIL
                        };
                    }
                    
                    console.log('Usuário autenticado com sucesso:', autenticado);
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
        }
    } else {
        console.log('Erros de validação no formulário:', erros.array());
    }
    
    // Define os dados de autenticação na sessão
    req.session.autenticado = autenticado;
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
