const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const sessionRoute = require('./src/routes/session');
const qrRoute = require('./src/routes/qr');
const { sendMessage, scheduleMessageLocal } = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS ---
import cors from "cors";
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
    const result = await sendMessage(clinic_id, phone, message, appointment_id);
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
    scheduleMessageLocal(clinic_id, phone, message, send_at, appointment_id);
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
