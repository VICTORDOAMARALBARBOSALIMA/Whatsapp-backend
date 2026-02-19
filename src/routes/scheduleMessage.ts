import { Router } from 'express';
import { scheduleMessageLocal } from '../../services/whatsappService';

const router = Router();

router.post('/', (req, res) => {
  const { clinic_id, patient_phone, message_content, send_at, appointment_id } = req.body;

  if (!clinic_id || !patient_phone || !message_content || !send_at) {
    return res.status(400).json({ success: false, error: 'clinic_id, patient_phone, message_content e send_at são obrigatórios' });
  }

  scheduleMessageLocal(clinic_id, patient_phone, message_content, send_at, appointment_id);
  res.json({ success: true, scheduled: true });
});

export default router;
