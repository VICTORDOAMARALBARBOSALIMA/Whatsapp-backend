import { Router } from 'express';
import { sendMessage } from '../../services/whatsappService';

const router = Router();

router.post('/', async (req, res) => {
  const { clinic_id, patient_phone, message_content, appointment_id } = req.body;

  // Validação básica
  if (!clinic_id || !patient_phone || !message_content) {
    return res.status(400).json({ success: false, error: 'clinic_id, patient_phone e message_content são obrigatórios' });
  }

  try {
    const result = await sendMessage(clinic_id, patient_phone, message_content, appointment_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
