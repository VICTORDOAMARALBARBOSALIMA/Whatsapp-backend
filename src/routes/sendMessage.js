// services/whatsappService.js (apenas a função sendMessage ajustada)

async function sendMessage(clinic_id, to, message, appointment_id = null) {
  // Inicializa ou recupera o client do WhatsApp
  const client = await initSession(clinic_id);

  // Aguarda o client estar pronto (sessão carregada)
  await waitUntilReady(client, clinic_id);

  // Força o formato correto do número para WhatsApp
  // Ex: 5511999999999 -> 5511999999999@c.us
  const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`;

  try {
    // Envia a mensagem
    await client.sendMessage(chatId, message);

    // Loga o envio como 'sent'
    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'sent',
      type: 'immediate',
      template_name: null,
      appointment_id
    });

    // Retorna sucesso
    return { success: true, external_message_id: `${clinic_id}-${Date.now()}` };

  } catch (err) {
    // Captura qualquer tipo de erro e converte em string legível
    const errorMsg = (err && err.message) ? err.message : JSON.stringify(err);

    console.error(`Erro ao enviar para ${to}:`, errorMsg);

    // Loga o erro
    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'error',
      type: 'immediate',
      template_name: null,
      appointment_id
    });

    // Retorna o erro
    return { success: false, error: errorMsg };
  }
}

module.exports = { sendMessage };
