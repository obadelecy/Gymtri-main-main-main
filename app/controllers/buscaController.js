const profisModel = require("../models/profisModel");

const buscaController = {
    // Buscar profissionais para autocomplete
    buscarProfissionais: async (req, res) => {
        try {
            const { termo } = req.query;
            
            if (!termo || termo.length < 2) {
                return res.json([]);
            }
            
            const resultados = await profisModel.buscarPorNome(termo);
            res.json(resultados);
            
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
            res.status(500).json({ error: 'Erro ao buscar profissionais' });
        }
    },
    
    // Listar todos os profissionais ativos
    listarProfissionais: async (req, res) => {
        try {
            const profissionais = await profisModel.listarAtivos();
            res.json(profissionais);
        } catch (error) {
            console.error('Erro ao listar profissionais:', error);
            res.status(500).json({ error: 'Erro ao listar profissionais' });
        }
    }
};

module.exports = buscaController;
