// src/routes/session.js
const express = require('express');
const router = express.Router();
const { clients } = require('../../services/whatsappService');

/**
 * GET /status/:clinic_id
 * Retorna o status da sessão do WhatsApp
 */
router.get('/status/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const client = clients[clinic_id];

  if (client && client.info && client.info.wid) {
    return res.json({ status: 'active', message: 'Sessão ativa!' });
  }

  res.json({ status: 'inactive', message: 'Sessão não está ativa' });
});

/**
 * POST /logout/:clinic_id
 * Encerra a sessão do WhatsApp
 */
router.post('/logout/:clinic_id', async (req, res) => {
  const { clinic_id } = req.params;
  const client = clients[clinic_id];

  if (!client) {
    return res.status(400).json({ status: 'error', message: 'Nenhuma sessão ativa para este clinic_id' });
  }

  try {
    await client.destroy(); // encerra o client
    delete clients[clinic_id]; // remove do objeto
    res.json({ status: 'success', message: 'Sessão encerrada com sucesso' });
  } catch (err) {
    console.error('Erro ao encerrar sessão:', err);
    res.status(500).json({ status: 'error', message: 'Erro ao encerrar sessão' });
  }
});

module.exports = router;
