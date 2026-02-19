// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // <- IMPORTANTE
const { sendMessage, scheduleMessageLocal } = require('./services/whatsappService');
const sessionRoute = require('./src/routes/session');
const qrRoute = require('./src/routes/qr');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// CORS configurado
// -------------------------
app.use(cors({
  origin: ['https://formulape2.mocha.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(cors({ origin: 'https://formulape2.mocha.app' }));
// -------------------------
// Body parser
// -------------------------
app.use(bodyParser.json());

// -------------------------
// Rotas
// -------------------------
app.use('/', sessionRoute);
app.use('/qr', qrRoute);

// Status simples
app.get('/', (req, res) => {
  res.json({ status: 'WhatsApp backend ativo!' });
});

// Envio de mensagem imediata
app.post('/send', async (req, res) => {
  const { clinic_id, phone, message, appointment_id } = req.body;

  if (!clinic_id || !phone || !message) {
    return res.status(400).json({ error: 'clinic_id, phone e message são obrigatórios' });
  }

  try {
    const result = await sendMessage(clinic_id, phone, message, appointment_id);
    res.json(result);
  } catch (err) {
    console.error('Erro na rota /send:', err);
    res.status(500).json({ error: 'Erro interno ao enviar mensagem' });
  }
});

// Agendar mensagem
app.post('/schedule', (req, res) => {
  const { clinic_id, phone, message, send_at, appointment_id } = req.body;

  if (!clinic_id || !phone || !message || !send_at) {
    return res.status(400).json({ error: 'clinic_id, phone, message e send_at são obrigatórios' });
  }

  try {
    scheduleMessageLocal(clinic_id, phone, message, send_at, appointment_id);
    res.json({ success: true, info: 'Mensagem agendada com sucesso!' });
  } catch (err) {
    console.error('Erro na rota /schedule:', err);
    res.status(500).json({ error: 'Erro interno ao agendar mensagem' });
  }
});

// -------------------------
// Start server
// -------------------------
app.listen(PORT, () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
});
