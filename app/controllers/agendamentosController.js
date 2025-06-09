const pool = require('../../config/pool_conexoes');
const {body, validationResult} = require('express-validator');
const novoAgendModel = require('../models/novoAgendModel');

// Funções de formatação
const formatarData = (dataISO) => {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
};

const formatarHora = (hora) => {
    // Se já estiver no formato HH:MM:SS ou HH:MM, retorna apenas HH:MM
    if (typeof hora === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
        return hora.split(':').slice(0, 2).join(':');
    }
    
    // Se for um objeto Date ou string de data válida
    try {
        const data = new Date(hora);
        if (!isNaN(data.getTime())) { // Verifica se é uma data válida
            const horas = data.getHours().toString().padStart(2, '0');
            const minutos = data.getMinutes().toString().padStart(2, '0');
            return `${horas}:${minutos}`;
        }
    } catch (e) {
        console.error('Erro ao formatar hora:', e);
    }
    
    // Retorna vazio se não for possível formatar
    return '';
};

const agendamentosController = {
    // Busca profissionais por especialidade
    getProfissionais: async (req, res) => {
        try {
            console.log('Recebida requisição para buscar profissionais');
            console.log('URL da requisição:', req.originalUrl);
            console.log('Especialidade:', req.query.especialidade);
            console.log('Usuário autenticado:', req.session.autenticado);
            console.log('Headers da requisição:', req.headers);
            
            const especialidade = req.query.especialidade;
            const profissionais = await novoAgendModel.findProfissionais(especialidade);
            
            console.log('Profissionais encontrados:', profissionais);
            res.header('Content-Type', 'application/json');
            res.json(profissionais);
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
            res.status(500).json({ error: 'Erro ao buscar profissionais' });
        }
    },

    // Validações para os campos do formulário
    regrasValidacao: [
        body("area").not().equals("null").withMessage("Selecione uma especialidade válida!"),
        body("professional").not().equals("null").withMessage("Selecione um profissional válido!"),
        body("date").isISO8601().withMessage("Data inválida!"),
        body("time").notEmpty().withMessage("Horário obrigatório!"),
        body("reason").isLength({ min: 5, max: 200 }).withMessage("Descrição deve ter entre 5 e 200 caracteres!")
    ],

    // Lista os agendamentos do usuário
    listarAgendamentos: async (req, res) => {
        try {
            console.log('Iniciando listagem de agendamentos');
            const usuario = req.session.autenticado; // Obtém o usuário da sessão
            console.log('Usuário autenticado:', usuario);
            
            // Verifica se o usuário está autenticado
            if (!usuario || !usuario.id) {
                console.warn('Usuário não autenticado ou sem ID');
                return res.render("pages/Aluno/agendamento", {
                    agendamentosFormatados: [],
                    temAgendamentos: false,
                    flash: req.flash()
                });
            }

            try {
                // Usa o novo método do modelo para listar agendamentos por aluno (usando CPF_ALUNO)
                const agendamentos = await novoAgendModel.findByAluno(usuario.id);
                console.log('Agendamentos encontrados:', agendamentos);
                console.log('Número de agendamentos:', agendamentos.length);

                // Verificar se há agendamentos válidos
                const temAgendamentos = agendamentos.length > 0;

                // Formatar os dados para garantir consistência
                const agendamentosFormatados = agendamentos.map(agendamento => ({
                    tipo: agendamento.tipo || 'Consulta',
                    profissional: agendamento.nome_profissional || 'Profissional não encontrado',
                    data: formatarData(agendamento.DATA_AGENDAMENTO),
                    horario: formatarHora(agendamento.HORARIO),
                    protocolo: agendamento.PROTOCOLO
                }));

                // Adicionando logs para debug
                console.log('Agendamentos formatados:', agendamentosFormatados);
                console.log('Tem agendamentos:', temAgendamentos);

                res.render("pages/Aluno/agendamento", {
                    agendamentosFormatados: agendamentosFormatados,
                    temAgendamentos: temAgendamentos,
                    flash: req.flash()
                });
            } catch (error) {
                console.error('Erro ao listar agendamentos:', error);
                res.render("pages/Aluno/agendamento", {
                    agendamentosFormatados: [],
                    temAgendamentos: false,
                    flash: req.flash()
                });
            }
        } catch (error) {
            console.error('Erro geral ao listar agendamentos:', error);
            res.render("pages/Aluno/agendamento", {
                agendamentosFormatados: [],
                temAgendamentos: false,
                flash: req.flash()
            });
        }
    },

    // Exibe a página de novo agendamento
    novoAgendamento: async (req, res) => {
        try {
            // Busca os profissionais ativos
            const especialidade = req.query.area || 'nutricionista'; // Usa a especialidade passada por query ou nutricionista como padrão
            const profissionais = await novoAgendModel.findProfissionais(especialidade);

            res.render("pages/Aluno/novoAgendamento", {
                nutricionista: "Nutricionista",
                personal: "Personal Trainer",
                profissionais: profissionais,
                nome_profissional: "",
                date: "",
                time: "",
                dateError: "",
                timeError: "",
                descricao: ""
            });
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
            res.render("pages/Aluno/novoAgendamento", {
                nutricionista: "Nutricionista",
                personal: "Personal Trainer",
                profissionais: [],
                nome_profissional: "",
                date: "",
                time: "",
                dateError: "",
                timeError: "",
                descricao: ""
            });
        }
    },

    // Função para criar agendamento
    criarAgendamento: async (req, res) => {
        const isAjax = req.get('Content-Type') === 'application/json';
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            if (isAjax) {
                return res.status(400).json({
                    success: false,
                    message: 'Erro de validação',
                    errors: errors.array()
                });
            }
            return res.status(400).render('pages/Aluno/novoAgendamento', {
                errors: errors.array(),
                agendamento: req.body
            });
        }

        const dadosForm = {
            NUMERO_DOC: req.body.professional,
            CPF_ALUNO: req.session.autenticado.id,
            DURACAO: '00:30:00',
            HORARIO: req.body.time,
            DATA_AGENDAMENTO: req.body.date,
            MOTIVO: req.body.reason || ''
        };

        try {
            await novoAgendModel.create(dadosForm);
            
            if (isAjax) {
                return res.json({
                    success: true,
                    message: 'Agendamento criado com sucesso!',
                    redirect: '/aluno/agendamentos'
                });
            }

            req.flash('success_msg', 'Agendamento criado com sucesso!');
            res.redirect('/aluno/agendamentos');
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            
            if (isAjax) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar agendamento',
                    error: error.message
                });
            }
            
            req.flash('error_msg', 'Erro ao criar agendamento');
            res.redirect('/aluno/agendamentos/novo');
        }
    },

    // Função para exibir formulário de edição
    editarAgendamento: async (req, res) => {
        try {
            const protocolo = req.params.id;
            const agendamento = await novoAgendModel.findId(protocolo);
            
            if (!agendamento || !agendamento.length) {
                return res.status(404).render('pages/Aluno/agendamento', {
                    error: 'Agendamento não encontrado',
                    agendamentosFormatados: [],
                    temAgendamentos: false,
                    flash: req.flash()
                });
            }

            // Buscar o profissional para obter a especialidade
            const profissional = await novoAgendModel.findProfissionalById(agendamento[0].NUMERO_DOC);
            const especialidade = profissional && profissional.tipo ? profissional.tipo : 'Nutricionista';

            // Formatar data e hora para exibição no formulário
            const agendamentoFormatado = {
                ...agendamento[0],
                DATA_AGENDAMENTO: agendamento[0].DATA_AGENDAMENTO.toISOString().split('T')[0], // Formato YYYY-MM-DD
                HORARIO: formatarHora(agendamento[0].HORARIO),
                tipo: especialidade,
                profissional_id: agendamento[0].NUMERO_DOC,
                profissional_nome: profissional ? profissional.nome : 'Profissional não encontrado'
            };

            // Buscar todos os profissionais da especialidade para o select
            const profissionais = await novoAgendModel.findProfissionais(especialidade);

            res.render('pages/Aluno/remarcarAgendamento', {
                agendamento: agendamentoFormatado,
                profissionais: profissionais || [],
                especialidades: ['Nutricionista', 'Personal Trainer'],
                errors: [] // Inicializa o array de erros vazio
            });
        } catch (error) {
            console.error('Erro ao buscar agendamento para edição:', error);
            res.status(500).render('pages/Aluno/agendamento', {
                error: 'Erro ao carregar agendamento para edição',
                agendamentosFormatados: [],
                temAgendamentos: false,
                flash: req.flash()
            });
        }
    },

    // Função para atualizar agendamento
    atualizarAgendamento: async (req, res) => {
        try {
            const protocolo = req.params.id;
            const { professional, date, time } = req.body;

            console.log('Dados recebidos do formulário:', { professional, date, time });

            // Validar dados
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('Erros de validação:', errors.array());
                return res.status(400).render('pages/Aluno/remarcarAgendamento', {
                    agendamento: req.body,
                    errors: errors.array()
                });
            }

            // Buscar o agendamento atual para obter dados adicionais
            const [agendamentoAtual] = await novoAgendModel.findId(protocolo);
            if (!agendamentoAtual) {
                req.flash('error_msg', 'Agendamento não encontrado');
                return res.redirect('/aluno/agendamentos');
            }

            // Preparar dados para atualização
            const dadosAtualizacao = {
                NUMERO_DOC: professional,
                DATA_AGENDAMENTO: date,
                HORARIO: time,
                // Manter os dados existentes que não foram alterados
                CPF_ALUNO: agendamentoAtual.CPF_ALUNO,
                DURACAO: agendamentoAtual.DURACAO,
                STATUS: agendamentoAtual.STATUS
            };

            console.log('Dados para atualização:', dadosAtualizacao);

            // Atualizar agendamento
            const resultado = await novoAgendModel.update(dadosAtualizacao, protocolo);

            if (resultado && resultado.affectedRows > 0) {
                req.flash('success_msg', 'Agendamento atualizado com sucesso!');
                return res.redirect('/aluno/agendamentos');
            }

            console.error('Nenhuma linha afetada na atualização');
            req.flash('error_msg', 'Nenhum registro foi atualizado. Verifique os dados e tente novamente.');
            return res.redirect(`/aluno/agendamentos/${protocolo}/editar`);
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            req.flash('error_msg', `Erro ao atualizar agendamento: ${error.message}`);
            return res.redirect(`/aluno/agendamentos/${req.params.id}/editar`);
        }
},

// Função para cancelar agendamento
cancelarAgendamento: async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Cancelando agendamento com ID: ${id}`);
        
        await novoAgendModel.delete(id);
        
        req.flash('success', 'Agendamento cancelado com sucesso!');
        res.redirect('/agendamento');
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        req.flash('error', 'Erro ao cancelar agendamento.');
        res.redirect('/agendamento');
    }
},
    // Lista os agendamentos do profissional logado
    listarAgendamentosProfissional: async (req, res) => {
        try {
            console.log('=== INÍCIO listarAgendamentosProfissional ===');
            console.log('Sessão completa:', JSON.stringify(req.session, null, 2));
            console.log('Headers:', req.headers);
            
            const usuario = req.session.autenticado; // Obtém o usuário da sessão
            console.log('Usuário da sessão:', JSON.stringify(usuario, null, 2));
            
            // Verifica se o usuário está autenticado e é um profissional
            if (!usuario) {
                console.warn('ERRO: Usuário não autenticado');
                req.flash('error', 'Você precisa fazer login para acessar esta página.');
                return res.redirect('/login');
            }
            
            if (!usuario.id) {
                console.warn('ERRO: ID do usuário não encontrado na sessão');
                req.flash('error', 'Dados de sessão inválidos. Por favor, faça login novamente.');
                return res.redirect('/login');
            }
            
            if (usuario.tipo !== 'profissional') {
                console.warn(`ACESSO NEGADO: Usuário do tipo '${usuario.tipo}' tentou acessar a área do profissional`);
                req.flash('error', 'Acesso restrito a profissionais.');
                return res.redirect('/login');
            }

            console.log('Buscando agendamentos para o profissional ID:', usuario.id);
            const agendamentos = await novoAgendModel.findByProfissional(usuario.id);
            console.log('Agendamentos encontrados:', agendamentos);

            // Formatar os dados para garantir consistência
            const agendamentosFormatados = agendamentos.map(agendamento => ({
                id: agendamento.PROTOCOLO,
                tipo: agendamento.tipo || 'Consulta',
                aluno: agendamento.nome_aluno || 'Aluno não encontrado',
                data: formatarData(agendamento.DATA_AGENDAMENTO),
                horario: formatarHora(agendamento.HORARIO),
                status: agendamento.STATUS,
                motivo: agendamento.MOTIVO || 'Sem motivo informado',
                protocolo: agendamento.PROTOCOLO
            }));

            // Verificar se há agendamentos
            const temAgendamentos = agendamentosFormatados.length > 0;
            console.log(`Total de agendamentos encontrados: ${agendamentosFormatados.length}`);
            
            // Dados para a view
            const viewData = {
                agendamentos: agendamentosFormatados,
                temAgendamentos,
                flash: req.flash(),
                usuario: req.session.autenticado
            };
            
            console.log('Dados enviados para a view:', JSON.stringify(viewData, null, 2));
            
            // Renderiza a página de agendamentos do profissional com os dados formatados
            res.render('pages/Profissional/agendaProfissional', viewData);
        } catch (error) {
            console.error('ERRO em listarAgendamentosProfissional:', error);
            console.error('Stack trace:', error.stack);
            req.flash('error', 'Ocorreu um erro ao carregar sua agenda. Por favor, tente novamente.');
            res.redirect('/profissional/interface');
        } finally {
            console.log('=== FIM listarAgendamentosProfissional ===');
        }
    }
};

module.exports = agendamentosController;
