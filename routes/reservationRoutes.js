const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { getStatus, mockDatabase } = require('../config/db');

// Available Flavour House Tables Configuration
const FLAVOUR_HOUSE_TABLES = [
  { tableId: 'PRIV-01', name: 'Private Champagne Suite A', zone: 'Private Dining Suite', capacity: 6, type: 'vip', status: 'available' },
  { tableId: 'PRIV-02', name: 'Private Champagne Suite B', zone: 'Private Dining Suite', capacity: 8, type: 'vip', status: 'reserved' },
  { tableId: 'CHEF-01', name: "Chef's Tasting Counter 01", zone: "Chef's Kitchen Bar", capacity: 4, type: 'interactive', status: 'available' },
  { tableId: 'TER-01', name: 'Garden Terrace Table 1', zone: 'Outdoor Courtyard', capacity: 2, type: 'romantic', status: 'available' },
  { tableId: 'TER-02', name: 'Garden Terrace Table 2', zone: 'Outdoor Courtyard', capacity: 4, type: 'romantic', status: 'available' },
  { tableId: 'SALON-01', name: 'Main Dining Salon 1', zone: 'Main Dining Room', capacity: 4, type: 'standard', status: 'available' },
  { tableId: 'SALON-02', name: 'Main Dining Salon 2', zone: 'Main Dining Room', capacity: 6, type: 'standard', status: 'occupied' },
  { tableId: 'SALON-03', name: 'Grand Family Salon Booth', zone: 'Main Dining Room', capacity: 8, type: 'family', status: 'available' }
];

// GET /api/reservations/tables
router.get('/tables', (req, res) => {
  res.status(200).json({ success: true, data: FLAVOUR_HOUSE_TABLES });
});

// GET /api/reservations
router.get('/', async (req, res) => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      const reservations = await Reservation.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: reservations });
    } else {
      return res.status(200).json({ success: true, data: mockDatabase.reservations });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reservations
router.post('/', async (req, res) => {
  try {
    const { customerName, email, phone, date, time, guests, tableId, spatialZone, specialRequests } = req.body;

    if (!customerName || !email || !phone || !date || !time || !tableId) {
      return res.status(400).json({ success: false, error: 'Please complete all required reservation fields.' });
    }

    const bookingId = `FH-RES-${Math.floor(100000 + Math.random() * 900000)}`;
    const status = getStatus();

    const reservationData = {
      bookingId,
      customerName,
      email,
      phone,
      date,
      time,
      guests: Number(guests) || 2,
      tableId,
      spatialZone: spatialZone || 'Main Dining Room',
      specialRequests: specialRequests || '',
      status: 'confirmed'
    };

    if (status.isConnected) {
      const newReservation = await Reservation.create(reservationData);
      return res.status(201).json({
        success: true,
        message: 'Flavour House Table Reservation confirmed successfully!',
        data: newReservation
      });
    } else {
      const newReservation = {
        _id: `fh-res-${Date.now()}`,
        ...reservationData,
        createdAt: new Date().toISOString()
      };
      mockDatabase.reservations.unshift(newReservation);
      return res.status(201).json({
        success: true,
        message: 'Flavour House Table Reservation confirmed successfully!',
        data: newReservation
      });
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
