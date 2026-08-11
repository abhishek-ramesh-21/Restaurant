const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1, max: 20 },
  tableId: { type: String, required: true }, // e.g. "T-01", "VIP-03", "DOME-02"
  spatialZone: { type: String, default: 'Standard Lounge' }, // e.g. "Spatial Dome", "Skyline Terrace", "VIP Pod"
  specialRequests: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' }
}, { timestamps: true });

module.exports = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
