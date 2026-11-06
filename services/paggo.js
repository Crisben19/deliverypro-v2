const axios = require('axios');

// ==========================================
// SERVICIO DE PAGOS CON PAGGO
// ==========================================

const PAGGO_API_URL = process.env.PAGGO_API_URL || 'https://api.paggo.com/v1';
const PAGGO_API_KEY = process.env.PAGGO_API_KEY;
const PAGGO_MERCHANT_ID = process.env.PAGGO_MERCHANT_ID;

/**
 * Crear un link de pago para un pedido
 * @param {number} monto - Monto total a cobrar
 * @param {string} descripcion - Descripción del pedido
 * @param {string} pedidoId - ID del pedido en nuestra base de datos
 * @returns {object} - { url: 'https://paggo.com/pay/...', paymentId: '...' }
 */
async function crearPago(monto, descripcion, pedidoId) {
  try {
    // Si no hay credenciales, devolvemos una simulación para desarrollo
    if (!PAGGO_API_KEY) {
      console.log('⚠️ Paggo no configurado. Simulando pago...');
      return {
        url: `https://sandbox.paggo.com/pay/simulado-${pedidoId}`,
        paymentId: `SIM-${Date.now()}`
      };
    }

    const response = await axios.post(`${PAGGO_API_URL}/payments`, {
      amount: Math.round(monto * 100), // En centavos
      currency: 'GTQ',
      description: descripcion,
      reference: pedidoId,
      merchant_id: PAGGO_MERCHANT_ID,
      callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/pagos/webhook`
    }, {
      headers: {
        'Authorization': `Bearer ${PAGGO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      url: response.data.payment_url,
      paymentId: response.data.id
    };
  } catch (error) {
    console.error('Error al crear pago con Paggo:', error.response?.data || error.message);
    throw new Error('No se pudo crear el pago');
  }
}

/**
 * Verificar el estado de un pago
 * @param {string} paymentId - ID del pago en Paggo
 * @returns {object} - { status: 'paid' | 'pending' | 'failed', ... }
 */
async function verificarPago(paymentId) {
  try {
    if (!PAGGO_API_KEY) {
      return { status: 'paid', simulacion: true };
    }

    const response = await axios.get(`${PAGGO_API_URL}/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${PAGGO_API_KEY}` }
    });

    return response.data;
  } catch (error) {
    console.error('Error al verificar pago:', error.message);
    throw new Error('No se pudo verificar el pago');
  }
}

module.exports = { crearPago, verificarPago };
