// src/routes/qr.js
const express = require('express');
const router = express.Router();
const { initSession, clients } = require('../../services/whatsappService');

/**
 * GET /qr/:clinic_id
 * Retorna QR code ou status da sessão
 */
router.get('/:clinic_id', async (req, res) => {
  const { clinic_id } = req.params;

  try {
    // Se já existe client e está pronto, retorna status ativo
    const existingClient = clients[clinic_id];
    if (existingClient && existingClient.info && existingClient.info.wid) {
      return res.json({ status: 'active', message: 'Sessão já ativa!' });
    }

    // Inicializa client (ou pega existente)
    const client = await initSession(clinic_id);

    let sentResponse = false;

    // Evento QR
    const qrListener = (qr) => {
      if (!sentResponse) {
        sentResponse = true;
        res.json({ status: 'qr', qr });
      }
    };

    // Evento ready
    const readyListener = () => {
      if (!sentResponse) {
        sentResponse = true;
        res.json({ status: 'active', message: 'Sessão já ativa!' });
      }
    };

    client.once('qr', qrListener);
    client.once('ready', readyListener);

    // Timeout de 60s caso não gere QR
    setTimeout(() => {
      if (!sentResponse) {
        sentResponse = true;
        res.status(500).json({
          status: 'error',
          message: 'Não foi possível gerar o QR code. Tente novamente.'
        });
      }
    }, 60000);

  } catch (err) {
    console.error('Erro ao gerar QR code:', err);
    res.status(500).json({ status: 'error', message: 'Erro ao gerar QR code' });
  }
});

module.exports = router;
