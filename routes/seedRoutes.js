const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { getStatus, mockDatabase } = require('../config/db');

const initialMenuItems = [
  // Starters
  {
    name: "Truffle & Forest Mushroom Crostini",
    category: "starters",
    price: 19.00,
    description: "Sourdough crostini topped with sauteed wild chanterelles, black truffle carpaccio, whipped goat ricotta, and aged balsamic glaze.",
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegetarian", "Chef Special"],
    spiceLevel: 0,
    calories: 310,
    rating: 4.9,
    spatialTag: "House Classic"
  },
  {
    name: "Wood-Fired Wagyu Beef Carpaccio",
    category: "starters",
    price: 26.00,
    description: "Seared A5 Wagyu slice, caper berries, pickled shallots, shaved Parmigiano-Reggiano, and cold-pressed olive oil.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    diet: ["Chef Special", "Gluten-Free"],
    spiceLevel: 1,
    calories: 360,
    rating: 5.0,
    spatialTag: "Signature Reserve"
  },
  {
    name: "Chilled Hokkaido Scallop Ceviche",
    category: "starters",
    price: 23.50,
    description: "Day-boat Hokkaido scallops dressed in passionfruit tiger's milk, avocado cream, and radish ribbons.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    diet: ["Gluten-Free", "Halal"],
    spiceLevel: 0,
    calories: 220,
    rating: 4.8,
    spatialTag: "Fresh Catch"
  },

  // Main Course
  {
    name: "Flavour House Prime Dry-Aged Ribeye",
    category: "main-course",
    price: 58.00,
    description: "45-day dry-aged USDA Prime 12oz ribeye, charred shallot butter, smoked sea salt, and red wine reduction.",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",
    diet: ["Chef Special", "Gluten-Free"],
    spiceLevel: 0,
    calories: 820,
    rating: 5.0,
    spatialTag: "Flavour House Prime"
  },
  {
    name: "Pan-Seared Wild Chilean Sea Bass",
    category: "main-course",
    price: 44.00,
    description: "Wild sea bass served over saffron risotto, braised baby fennel, and lemongrass yuzu velouté.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
    diet: ["Halal", "Gluten-Free"],
    spiceLevel: 0,
    calories: 540,
    rating: 4.9,
    spatialTag: "Ocean Selection"
  },
  {
    name: "Handcrafted Saffron & Morel Tagliatelle",
    category: "main-course",
    price: 36.00,
    description: "Fresh egg pasta tossed in Kashmiri saffron cream, wild morel mushrooms, and shaved winter truffle.",
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegetarian"],
    spiceLevel: 0,
    calories: 620,
    rating: 4.8,
    spatialTag: "Artisanal Pasta"
  },
  {
    name: "Roasted Cauliflower & Harissa Steak",
    category: "main-course",
    price: 28.00,
    description: "Charred cauliflower steak over spiced harissa puree, toasted pomegranate, almond dukkah, and tahini drizzle.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Gluten-Free"],
    spiceLevel: 2,
    calories: 390,
    rating: 4.7,
    spatialTag: "Garden Plate"
  },

  // Desserts
  {
    name: "Valrhona Dark Chocolate Melting Sphere",
    category: "desserts",
    price: 19.50,
    description: "70% Grand Cru chocolate sphere melted table-side with warm salted caramel, espresso gelato & hazelnut praline.",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80",
    diet: ["Chef Special"],
    spiceLevel: 0,
    calories: 490,
    rating: 5.0,
    spatialTag: "Tableside Signature"
  },
  {
    name: "Bronte Pistachio & Orange Blossom Tart",
    category: "desserts",
    price: 16.00,
    description: "Sicilian pistachio frangipane, orange blossom cream, spun sugar web, and candied kumquats.",
    image: "/images/bronte_pistachio_tart.jpg",
    diet: ["Vegetarian"],
    spiceLevel: 0,
    calories: 360,
    rating: 4.9,
    spatialTag: "Pastry Studio"
  },

  // Soft Drinks & House Beverages
  {
    name: "Flavour House Botanical Tonic",
    category: "soft-drinks",
    price: 8.50,
    description: "House-made effervescent tonic infused with wild elderflower, cucumber hydrosol, and gold sparkle.",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Gluten-Free", "Zero Proof"],
    spiceLevel: 0,
    calories: 60,
    rating: 4.9,
    spatialTag: "House Tonic"
  },
  {
    name: "Crafted Yuzu & Wild Ginger Fizz",
    category: "soft-drinks",
    price: 8.00,
    description: "Japanese Yuzu juice, cold-pressed ginger root syrup, and sparkling mountain water.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Gluten-Free"],
    spiceLevel: 1,
    calories: 95,
    rating: 4.8,
    spatialTag: "Cold Brewed"
  },
  {
    name: "Organic Dragonfruit & Lychee Nectar",
    category: "soft-drinks",
    price: 9.00,
    description: "Pressed red dragonfruit, fresh lychee juice, and crushed coconut blossom water.",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Gluten-Free"],
    spiceLevel: 0,
    calories: 85,
    rating: 4.9,
    spatialTag: "Organic Blend"
  },
  {
    name: "Emerald Green Cold-Pressed Elixir",
    category: "soft-drinks",
    price: 8.50,
    description: "Organic Granny Smith apple, crisp cucumber, fresh peppermint, ginger, and lemon juice.",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Organic", "Gluten-Free"],
    spiceLevel: 0,
    calories: 70,
    rating: 4.7,
    spatialTag: "Fresh Pressed"
  },
  {
    name: "San Pellegrino & Acqua Panna (750ml)",
    category: "soft-drinks",
    price: 7.50,
    description: "Natural Italian sparkling mineral water or Tuscan Still Spring Water bottled at the source.",
    image: "https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Gluten-Free"],
    spiceLevel: 0,
    calories: 0,
    rating: 4.9,
    spatialTag: "Imported Reserve"
  },

  // Cocktails & Zero-Proof Cocktails
  {
    name: "Smoked Oak & Honey Old Fashioned",
    category: "cocktails-mocktails",
    price: 19.00,
    description: "Small-batch bourbon, smoked rosemary syrup, aromatic bitters, and hand-carved crystal ice sphere.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    diet: ["Chef Special"],
    spiceLevel: 0,
    calories: 195,
    rating: 5.0,
    spatialTag: "Oak Smoked"
  },
  {
    name: "Lavender Butterfly Pea Spritz (Zero Proof)",
    category: "cocktails-mocktails",
    price: 13.00,
    description: "Butterfly pea flower infusion, white peach puree, sparkling soda, and fresh mint.",
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80",
    diet: ["Vegan", "Zero Proof"],
    spiceLevel: 0,
    calories: 80,
    rating: 4.9,
    spatialTag: "Zero-Proof Art"
  }
];

// Seed Endpoint
router.post('/', async (req, res) => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      await MenuItem.deleteMany({});
      const seededItems = await MenuItem.insertMany(initialMenuItems);
      return res.status(200).json({
        success: true,
        message: 'Successfully seeded menu items for Flavour House!',
        count: seededItems.length,
        items: seededItems
      });
    } else {
      mockDatabase.menuItems = initialMenuItems.map((item, index) => ({
        _id: `fh-menu-${index + 1}`,
        ...item
      }));
      return res.status(200).json({
        success: true,
        message: 'Seeded menu items into Flavour House Memory Store!',
        count: mockDatabase.menuItems.length,
        items: mockDatabase.menuItems
      });
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const autoSeed = async () => {
  try {
    const status = getStatus();
    if (status.isConnected) {
      await MenuItem.deleteMany({});
      await MenuItem.insertMany(initialMenuItems);
      console.log('[AutoSeed] Flavour House database updated with luxury culinary menu.');
    } else {
      mockDatabase.menuItems = initialMenuItems.map((item, index) => ({
        _id: `fh-menu-${index + 1}`,
        ...item
      }));
      console.log('[AutoSeed] Flavour House memory store updated with luxury culinary menu.');
    }
  } catch (e) {
    console.warn('[AutoSeed] Error:', e.message);
  }
};

module.exports = { router, autoSeed, initialMenuItems };
