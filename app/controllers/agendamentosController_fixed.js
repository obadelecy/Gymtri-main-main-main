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
    const data = new Date(hora);
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('pages/Aluno/novoAgendamento', {
                errors: errors.array(),
                agendamento: req.body
            });
        }
        const dadosForm = {
            NUMERO_DOC: req.body.professional,
            CPF_ALUNO: req.session.autenticado.id, // ou req.session.usuario.id
            DURACAO: '00:30:00',
            HORARIO: req.body.time, // ex: '15:47'
            DATA_AGENDAMENTO: req.body.date // ex: '2025-06-07'
        };
        try {
            await novoAgendModel.create(dadosForm);
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.json({ success: true, message: 'Agendamento criado com sucesso!' });
            }
            req.flash('success_msg', 'Agendamento criado com sucesso!');
            return res.redirect('/aluno/agendamentos');
        } catch (error) {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ success: false, message: 'Erro ao criar agendamento.' });
            }
            req.flash('error_msg', 'Erro ao criar agendamento. Tente novamente.');
            return res.redirect('/aluno/agendamentos');
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

            // Formatar data e hora para exibição no formulário
            const agendamentoFormatado = {
                ...agendamento[0],
                DATA_AGENDAMENTO: formatarData(agendamento[0].DATA_AGENDAMENTO),
                HORARIO: formatarHora(agendamento[0].HORARIO)
            };

            res.render('pages/Aluno/remarcarAgendamento', {
                agendamento: agendamentoFormatado,
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
            const { NUMERO_DOC, DATA_AGENDAMENTO, HORARIO } = req.body;

            // Validar dados
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).render('pages/Aluno/remarcarAgendamento', {
                    agendamento: req.body,
                    errors: errors.array()
                });
            }

            // Atualizar agendamento
            const resultado = await novoAgendModel.update({
                NUMERO_DOC,
                DATA_AGENDAMENTO,
                HORARIO
            }, protocolo);

            if (resultado) {
                req.flash('success_msg', 'Agendamento atualizado com sucesso!');
                return res.redirect('/aluno/agendamentos');
            }

            req.flash('error_msg', 'Erro ao atualizar agendamento');
            res.redirect(`/aluno/agendamentos/${protocolo}/editar`);
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            req.flash('error_msg', 'Erro ao atualizar agendamento');
            res.redirect(`/aluno/agendamentos/${req.params.id}/editar`);
        }
    },

    // Função para cancelar agendamento
    cancelarAgendamento: async (req, res) => {
        try {
            const protocolo = req.params.id;
            const resultado = await novoAgendModel.delete(protocolo);

            if (resultado) {
                req.flash('success_msg', 'Agendamento cancelado com sucesso!');
                return res.redirect('/aluno/agendamentos');
            }

            req.flash('error_msg', 'Erro ao cancelar agendamento');
            res.redirect('/aluno/agendamentos');
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            req.flash('error_msg', 'Erro ao cancelar agendamento');
            res.redirect('/aluno/agendamentos');
        }
    }
};

module.exports = agendamentosController;
