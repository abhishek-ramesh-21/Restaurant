const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { getStatus, mockDatabase } = require('../config/db');

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { items, customerInfo, paymentMethod, orderType, tableId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Cart items cannot be empty.' });
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({ success: false, error: 'Customer information is missing.' });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2)); // 8% sales tax
    const serviceFee = 2.50;
    const total = Number((subtotal + tax + serviceFee).toFixed(2));

    const orderId = `AURA-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const transactionId = `TX-SPATIAL-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    const orderData = {
      orderId,
      items,
      subtotal,
      tax,
      serviceFee,
      total,
      orderType: orderType || 'dine-in',
      tableId: tableId || 'T-ONLINE',
      customerInfo,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'paid',
      transactionId,
      status: 'received'
    };

    const status = getStatus();

    if (status.isConnected) {
      const newOrder = await Order.create(orderData);
      return res.status(201).json({
        success: true,
        message: 'Spatial Order & Payment processed successfully!',
        data: newOrder
      });
    } else {
      const newOrder = {
        _id: `mock-ord-${Date.now()}`,
        ...orderData,
        createdAt: new Date().toISOString()
      };
      mockDatabase.orders.unshift(newOrder);
      return res.status(201).json({
        success: true,
        message: 'Spatial Order & Payment processed successfully!',
        data: newOrder
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/orders/payment/simulate
router.post('/payment/simulate', (req, res) => {
  const { cardNumber, cardName, expiry, cvv, amount, paymentMethod } = req.body;

  // Simulate payment processing delay & verification
  if (paymentMethod === 'card' && (!cardNumber || cardNumber.replace(/\s/g, '').length < 15)) {
    return res.status(400).json({ success: false, error: 'Invalid card details provided.' });
  }

  const transactionHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');

  return res.status(200).json({
    success: true,
    message: 'Payment Gateway Authorized',
    paymentStatus: 'APPROVED',
    transactionHash,
    amount: amount || 0,
    timestamp: new Date().toISOString()
  });
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      const order = await Order.findOne({ orderId: req.params.id }) || await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
      return res.status(200).json({ success: true, data: order });
    } else {
      const order = mockDatabase.orders.find(o => o.orderId === req.params.id || o._id === req.params.id);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
      return res.status(200).json({ success: true, data: order });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: orders });
    } else {
      return res.status(200).json({ success: true, data: mockDatabase.orders });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
