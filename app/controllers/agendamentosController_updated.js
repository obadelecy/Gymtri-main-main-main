// ... (código anterior permanece o mesmo até a linha 264)

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

    // ... (o resto do código permanece o mesmo)
};
