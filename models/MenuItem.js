const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['starters', 'main-course', 'desserts', 'soft-drinks', 'cocktails-mocktails', 'chefs-specials']
  },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  diet: [{ type: String }], // e.g. ['Vegan', 'Gluten-Free', 'Halal', 'Organic', 'Chef Special']
  spiceLevel: { type: Number, default: 0 }, // 0 (mild) to 3 (extra spicy)
  calories: { type: Number },
  rating: { type: Number, default: 4.8 },
  isAvailable: { type: Boolean, default: true },
  spatialTag: { type: String } // e.g. "Signature Infusion", "Aura Exclusive", "Zero Proof"
}, { timestamps: true });

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
