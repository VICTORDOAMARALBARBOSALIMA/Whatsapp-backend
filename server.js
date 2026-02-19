// --- Imports ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// --- WhatsApp ---
const { Client } = require('whatsapp-web.js');

const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED:', qr);
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação do WhatsApp:', msg);
});

client.initialize();

// --- Services ---
const { sendMessage, scheduleMessageLocal } = require('./services/whatsappService');

// --- Rotas ---
await sendMessage(clinic_id, phone, message, appointment_id);
scheduleMessageLocal(clinic_id, phone, message, send_at, appointment_id);

const sessionRoute = require('./src/routes/session');
const qrRoute = require('./src/routes/qr');

// --- Express setup ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['https://app.formulape.app.br', 'https://formulape2.mocha.app']
}));
app.use(bodyParser.json());

// --- Rotas ---
app.use('/', sessionRoute);
app.use('/qr', qrRoute);

app.post('/send', async (req, res) => {
    const { clinic_id, phone, message, appointment_id } = req.body;
    if (!clinic_id || !phone || !message) return res.status(400).json({ error: 'Faltando parâmetros' });
    try {
        const result = await sendMessage(client, clinic_id, phone, message, appointment_id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem' });
    }
});

app.post('/schedule', (req, res) => {
    const { clinic_id, phone, message, send_at, appointment_id } = req.body;
    if (!clinic_id || !phone || !message || !send_at) return res.status(400).json({ error: 'Faltando parâmetros' });
    try {
        scheduleMessageLocal(client, clinic_id, phone, message, send_at, appointment_id);
        res.json({ success: true, info: 'Mensagem agendada!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno ao agendar mensagem' });
    }
});

// --- Status teste ---
app.get('/', (req, res) => res.json({ status: 'WhatsApp backend ativo!' }));

// --- Start ---
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = { client };
