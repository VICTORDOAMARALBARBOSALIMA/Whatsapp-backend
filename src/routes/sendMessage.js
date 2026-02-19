const express = require('express');
const router = express.Router();
const { sendMessage } = require('../../services/whatsappService');

router.post('/', async (req, res) => {
  const { clinic_id, patient_phone, message_content, appointment_id } = req.body;
  if (!clinic_id || !patient_phone || !message_content) {
    return res.status(400).json({ success: false, error: 'clinic_id, patient_phone e message_content são obrigatórios' });
  }
  const result = await sendMessage(clinic_id, patient_phone, message_content, appointment_id);
  res.json(result);
});

module.exports = router;
