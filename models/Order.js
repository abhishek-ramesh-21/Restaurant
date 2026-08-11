const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  notes: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  serviceFee: { type: Number, default: 2.50 },
  total: { type: Number, required: true },
  orderType: { type: String, enum: ['dine-in', 'takeaway', 'spatial-delivery'], default: 'dine-in' },
  tableId: { type: String },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String }
  },
  paymentMethod: { type: String, required: true }, // e.g., 'card', 'apple-pay', 'crypto', 'cash'
  paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
  transactionId: { type: String },
  status: { type: String, enum: ['received', 'preparing', 'ready', 'served', 'completed'], default: 'received' }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
