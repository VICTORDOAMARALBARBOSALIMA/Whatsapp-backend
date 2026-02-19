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

    // Função para aguardar QR
    const qrCode = await new Promise((resolve, reject) => {
      let handled = false;

      // Quando QR for gerado
      client.once('qr', qr => {
        if (!handled) {
          handled = true;
          resolve(qr);
        }
      });

      // Se o client ficar pronto antes do QR
      client.once('ready', () => {
        if (!handled) {
          handled = true;
          resolve(null); // null indica que já está ativo
        }
      });

      // Timeout 30s
      setTimeout(() => {
        if (!handled) {
          handled = true;
          reject(new Error('Não foi possível gerar o QR code. Tente novamente.'));
        }
      }, 30000);
    });

    if (qrCode) {
      return res.json({ status: 'qr', qr: qrCode });
    } else {
      return res.json({ status: 'active', message: 'Sessão já ativa!' });
    }

  } catch (err) {
    console.error('Erro ao gerar QR code:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Erro ao gerar QR code' });
  }
});

module.exports = router;
