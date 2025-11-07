
/* 
 * BACKEND NECESARIO (Node.js/Express)
 * Creá este archivo en tu backend: server.js
 */


const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar Mercado Pago
mercadopago.configure({
  access_token: 'TU_ACCESS_TOKEN_DE_MERCADO_PAGO'
});

// Crear preferencia de pago
app.post('/api/payment/create-preference', async (req, res) => {
  try {
    const { title, description, unit_price, quantity, betId, userId } = req.body;

    const preference = {
      items: [
        {
          title,
          description,
          unit_price: parseFloat(unit_price),
          quantity: parseInt(quantity)
        }
      ],
      back_urls: {
        success: 'http://localhost:5173/payment/success',
        failure: 'http://localhost:5173/payment/failure',
        pending: 'http://localhost:5173/payment/pending'
      },
      auto_return: 'approved',
      external_reference: betId,
      notification_url: 'https://tu-dominio.com/api/payment/webhook'
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({
      id: response.body.id,
      init_point: response.body.init_point
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
});

// Webhook de Mercado Pago
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment = await mercadopago.payment.findById(data.id);
      
      // Actualizar estado en Firebase
      // betService.updatePaymentStatus(...)
      
      console.log('Payment status:', payment.body.status);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Verificar estado de pago
app.get('/api/payment/status/:paymentId', async (req, res) => {
  try {
    const payment = await mercadopago.payment.findById(req.params.paymentId);
    res.json({
      status: payment.body.status,
      statusDetail: payment.body.status_detail
    });
  } catch (error) {
    console.error('Error checking payment:', error);
    res.status(500).json({ error: 'Error checking payment status' });
  }
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
