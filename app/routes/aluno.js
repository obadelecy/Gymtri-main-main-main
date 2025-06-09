const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');
const agendamentosController = require('../controllers/agendamentosController');
const { verificarUsuAutenticado } = require('../models/autenticador_middleware');

// Rota para a interface do usuário
router.get('/interfaceUsuario', verificarUsuAutenticado, (req, res) => {
  res.render('pages/interfaces/interfaceUsuario', { 
    usuario: req.session.autenticado || {},
    flash: req.flash() || {}
  });
});

// Rota para buscar profissionais por especialidade
router.get('/api/profissionais', verificarUsuAutenticado, agendamentosController.getProfissionais);

// Rotas de agendamentos
router.get('/agendamentos', verificarUsuAutenticado, agendamentosController.listarAgendamentos);
router.get('/agendamentos/novo', verificarUsuAutenticado, agendamentosController.novoAgendamento);
router.post('/agendamentos', verificarUsuAutenticado, agendamentosController.criarAgendamento);
router.get('/agendamentos/:id/editar', verificarUsuAutenticado, agendamentosController.editarAgendamento);
router.post('/agendamentos/:id/editar', verificarUsuAutenticado, agendamentosController.atualizarAgendamento);
router.post('/agendamentos/:id/cancelar', verificarUsuAutenticado, agendamentosController.cancelarAgendamento);

// Rota para a página de treinos
router.get('/treinos', verificarUsuAutenticado, (req, res) => {
  try {
    res.render('pages/Aluno/treinos', { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      treinos: []
    });
  } catch (error) {
    console.error('Erro ao renderizar a página de treinos:', error);
    res.status(500).send('Erro ao carregar a página de treinos');
  }
});

// Rota para a página de relatórios
router.get('/relatorio', verificarUsuAutenticado, (req, res) => {
  try {
    res.render('pages/Aluno/relatorio', { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      relatorios: []
    });
  } catch (error) {
    console.error('Erro ao renderizar a página de relatórios:', error);
    res.status(500).send('Erro ao carregar a página de relatórios');
  }
});

// Rota para a página de saúde
router.get('/saude', verificarUsuAutenticado, (req, res) => {
  try {
    res.render('pages/Aluno/saude', { 
      usuario: req.session.autenticado || {},
      flash: req.flash() || {},
      posts: []
    });
  } catch (error) {
    console.error('Erro ao renderizar a página de saúde:', error);
    res.status(500).send('Erro ao carregar a página de saúde');
  }
});

// Rota para editar dados do aluno
router.get('/editarDados', verificarUsuAutenticado, async (req, res) => {
  try {
    console.log('Sessão atual:', req.session); // Log para debug
    
    if (!req.session.autenticado || !req.session.autenticado.id) {
      console.log('Usuário não autenticado ou ID não encontrado na sessão');
      req.flash('error', 'Por favor, faça login novamente');
      return res.redirect('/login');
    }
    
    // Buscar dados atualizados do aluno
    const alunoModel = require('../models/alunoModel');
    const aluno = await alunoModel.findById(req.session.autenticado.id);
    
    if (!aluno || aluno.length === 0) {
      console.log('Aluno não encontrado no banco de dados');
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/login');
    }
    
    res.render("pages/Aluno/editarDados", { 
      usuario: aluno[0],
      flash: req.flash() || {}
    });
  } catch (error) {
    console.error('Erro ao carregar página de edição:', error);
    req.flash('error', 'Erro ao carregar a página de edição');
    res.redirect('/aluno/interfaceUsuario');
  }
});

// Rota para atualizar dados do aluno
router.post('/atualizarDados', verificarUsuAutenticado, async (req, res) => {
  try {
    if (!req.session.autenticado || !req.session.autenticado.id) {
      console.log('Usuário não autenticado ou ID não encontrado na sessão (POST)');
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const { nome, email, telefone, senhaAtual, novaSenha, confirmarSenha } = req.body;
    const alunoModel = require('../models/alunoModel');
    
    // Buscar aluno atual
    const [aluno] = await alunoModel.findById(req.session.autenticado.id);
    
    if (!aluno) {
      console.log('Aluno não encontrado com ID:', req.session.autenticado.id);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual se for alterar a senha
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ success: false, message: 'Informe a senha atual' });
      }
      
      const bcrypt = require('bcryptjs');
      const senhaValida = await bcrypt.compare(senhaAtual, aluno.SENHA);
      
      if (!senhaValida) {
        return res.status(400).json({ success: false, message: 'Senha atual incorreta' });
      }
      
      if (novaSenha !== confirmarSenha) {
        return res.status(400).json({ success: false, message: 'As senhas não conferem' });
      }
      
      // Criptografar a nova senha
      const salt = await bcrypt.genSalt(12);
      aluno.SENHA = await bcrypt.hash(novaSenha, salt);
    }
    
    // Atualizar dados
    aluno.NOME_COMPLETO = nome || aluno.NOME_COMPLETO;
    aluno.EMAIL = email || aluno.EMAIL;
    aluno.TELEFONE = telefone || aluno.TELEFONE;
    
    // Atualizar no banco de dados
    await alunoModel.update(aluno, req.session.autenticado.id);
    
    // Atualizar dados na sessão
    req.session.autenticado = {
      ...req.session.autenticado,
      nome: aluno.NOME_COMPLETO,
      email: aluno.EMAIL,
      telefone: aluno.TELEFONE
    };
    
    return res.json({ 
      success: true, 
      message: 'Dados atualizados com sucesso!',
      usuario: req.session.autenticado
    });
    
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar dados. Tente novamente.' 
    });
  }
});

// Rota para excluir conta do aluno
router.post('/excluirConta', verificarUsuAutenticado, async (req, res) => {
  // Inicia o log da requisição
  console.log('=== INÍCIO DA REQUISIÇÃO DE EXCLUSÃO DE CONTA ===');
  console.log('Data/Hora:', new Date().toISOString());
  console.log('Sessão ID:', req.sessionID);
  console.log('Dados da sessão:', JSON.stringify(req.session));
  
  try {
    // Verifica se o usuário está autenticado
    if (!req.session.autenticado || !req.session.autenticado.id) {
      const errorMsg = 'Usuário não autenticado ou ID não encontrado na sessão';
      console.error('Erro de autenticação:', errorMsg);
      return res.status(401).json({ 
        success: false, 
        message: errorMsg,
        errorCode: 'UNAUTHENTICATED',
        sessionData: req.session
      });
    }
    
    const cpf = req.session.autenticado.id;
    const { senha } = req.body;
    
    console.log('CPF do usuário autenticado:', cpf);
    console.log('Senha fornecida:', senha ? '*** (oculto)' : 'Não fornecida');
    
    // Validações de entrada
    if (!senha) {
      const errorMsg = 'Informe sua senha para confirmar a exclusão';
      console.error('Erro de validação:', errorMsg);
      return res.status(400).json({ 
        success: false, 
        message: errorMsg,
        errorCode: 'MISSING_PASSWORD'
      });
    }
    
    // Importa o modelo de aluno
    const alunoModel = require('../models/alunoModel');
    
    // Busca os dados do aluno
    console.log('Buscando dados do aluno com CPF:', cpf);
    const [aluno] = await alunoModel.findById(cpf);
    
    if (!aluno) {
      const errorMsg = `Usuário não encontrado para o CPF: ${cpf}`;
      console.error('Erro ao buscar aluno:', errorMsg);
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado',
        errorCode: 'USER_NOT_FOUND'
      });
    }
    
    console.log('Dados do aluno encontrado:', {
      nome: aluno.NOME_COMPLETO,
      email: aluno.EMAIL,
      cpf: aluno.CPF
    });
    
    // Verifica a senha
    console.log('Verificando a senha fornecida...');
    const bcrypt = require('bcryptjs');
    const senhaValida = await bcrypt.compare(senha, aluno.SENHA);
    
    if (!senhaValida) {
      console.error('Falha na autenticação: Senha incorreta');
      return res.status(400).json({ 
        success: false, 
        message: 'Senha incorreta',
        errorCode: 'INVALID_PASSWORD'
      });
    }
    
    console.log('Senha validada com sucesso. Iniciando processo de exclusão...');
    
    try {
      // Tenta excluir a conta
      console.log('Chamando o método delete do modelo...');
      const resultado = await alunoModel.delete(cpf);
      console.log('Resultado da operação de exclusão:', resultado);
      
      // Verifica se a exclusão foi bem-sucedida
      if (!resultado || resultado.affectedRows === 0) {
        const errorMsg = 'Nenhum registro foi afetado durante a exclusão';
        console.error('Erro na exclusão:', errorMsg);
        return res.status(500).json({ 
          success: false, 
          message: 'Não foi possível excluir a conta. Nenhum registro afetado.',
          errorCode: 'NO_RECORDS_AFFECTED',
          result: resultado
        });
      }
      
      console.log('Exclusão bem-sucedida. Encerrando a sessão do usuário...');
      
      // Encerra a sessão
      return new Promise((resolve) => {
        req.session.destroy((err) => {
          if (err) {
            console.error('Erro ao destruir a sessão:', err);
            // Mesmo com erro na destruição da sessão, consideramos a exclusão bem-sucedida
            // mas registramos o erro para análise posterior
          }
          
          console.log('Sessão encerrada com sucesso. Redirecionando para a página de login...');
          
          // Responde com sucesso
          resolve(res.json({ 
            success: true, 
            message: 'Sua conta foi excluída com sucesso!',
            redirect: '/login'
          }));
        });
      });
      
    } catch (dbError) {
      console.error('Erro no banco de dados durante a exclusão:', {
        message: dbError.message,
        code: dbError.code,
        sqlMessage: dbError.sqlMessage,
        sql: dbError.sql
      });
      
      throw {
        ...dbError,
        isDatabaseError: true,
        errorCode: 'DATABASE_ERROR'
      };
    }
    
  } catch (error) {
    console.error('ERRO CRÍTICO durante o processo de exclusão:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      isDatabaseError: error.isDatabaseError,
      errorCode: error.errorCode || 'UNKNOWN_ERROR'
    });
    
    // Mensagem de erro amigável para o usuário
    let userMessage = 'Ocorreu um erro ao tentar excluir sua conta. Por favor, tente novamente mais tarde.';
    
    // Mensagens mais específicas com base no tipo de erro
    if (error.isDatabaseError) {
      userMessage = 'Erro ao acessar o banco de dados. Por favor, tente novamente ou entre em contato com o suporte.';
    }
    
    return res.status(500).json({ 
      success: false, 
      message: userMessage,
      errorCode: error.errorCode || 'INTERNAL_SERVER_ERROR',
      // Em ambiente de desenvolvimento, incluir mais detalhes do erro
      ...(process.env.NODE_ENV === 'development' ? { 
        error: error.message,
        stack: error.stack
      } : {})
    });
  } finally {
    console.log('=== FIM DA REQUISIÇÃO DE EXCLUSÃO DE CONTA ===\n');
  }
});

module.exports = router;
