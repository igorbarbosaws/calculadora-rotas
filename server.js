require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
//const rateLimit = require('express-rate-limit');
const xss = require('xss');

const app = express();

app.use(cors());

//const apiLimiter = rateLimit({
//    windowMs: 15 * 60 * 1000,
//    max: 20,
//    message: { error: "Muitas solicitações. Tente novamente em 15 minutos." }
//});
//app.use('/api/', apiLimiter);

app.get('/api/distancia', async (req, res) => {
    const origem = xss(req.query.origem);
    const destino = xss(req.query.destino);
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!origem || !destino) {
        return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}&key=${apiKey}&language=pt-BR`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao conectar com o Google Maps' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
