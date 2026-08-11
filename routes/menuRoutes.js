const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { getStatus, mockDatabase } = require('../config/db');

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const { category, diet, search } = req.query;
    const status = getStatus();

    if (status.isConnected) {
      let query = {};
      if (category && category !== 'all') {
        query.category = category;
      }
      if (diet) {
        query.diet = diet;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { spatialTag: { $regex: search, $options: 'i' } }
        ];
      }
      const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
      return res.status(200).json({ success: true, data: items });
    } else {
      let items = [...mockDatabase.menuItems];
      if (category && category !== 'all') {
        items = items.filter(item => item.category === category);
      }
      if (diet) {
        items = items.filter(item => item.diet && item.diet.includes(diet));
      }
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q) ||
          (item.spatialTag && item.spatialTag.toLowerCase().includes(q))
        );
      }
      return res.status(200).json({ success: true, data: items });
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      const item = await MenuItem.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
      return res.status(200).json({ success: true, data: item });
    } else {
      const item = mockDatabase.menuItems.find(i => i._id === req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
      return res.status(200).json({ success: true, data: item });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/menu (Admin add item)
router.post('/', async (req, res) => {
  try {
    const status = getStatus();
    const newItemData = req.body;

    if (status.isConnected) {
      const createdItem = await MenuItem.create(newItemData);
      return res.status(201).json({ success: true, data: createdItem });
    } else {
      const createdItem = {
        _id: `mock-menu-${Date.now()}`,
        ...newItemData
      };
      mockDatabase.menuItems.push(createdItem);
      return res.status(201).json({ success: true, data: createdItem });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
