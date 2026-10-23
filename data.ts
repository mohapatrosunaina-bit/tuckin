export interface Restaurant {
  id: string;
  name: string;
  description: string;
  deliveryZone: string;
  isOpen: boolean;
  cuisine: string;
  rating: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pricePaise: number;
  available: boolean;
  category: string;
}

export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-spice-box',
    name: 'The Spice Box Kitchen',
    description: 'Authentic Hyderabadi dum biryanis, kebabs, and rich slow-cooked curries.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'Biryani & North Indian',
    rating: 4.8
  },
  {
    id: 'rest-dosa-corner',
    name: 'Madras Tiffin Room',
    description: 'Crispy ghee dosas, steaming soft idlis, and filter kaapi brewed fresh.',
    deliveryZone: 'zone-central-demo',
    isOpen: true,
    cuisine: 'South Indian Breakfast',
    rating: 4.6
  },
  {
    id: 'rest-wok-express',
    name: 'Dragon Wok Express',
    description: 'Sizzling wok-tossed noodles, spicy schezwan momos, and crispy appetizers.',
    deliveryZone: 'zone-north-demo',
    isOpen: true,
    cuisine: 'Pan-Asian & Indo-Chinese',
    rating: 4.5
  }
];

export const SEED_MENU_ITEMS: MenuItem[] = [
  // The Spice Box Kitchen
  {
    id: 'item-biryani-001',
    restaurantId: 'rest-spice-box',
    name: 'Royal Veg Dum Biryani',
    description: 'Fragrant basmati rice layered with fresh vegetables and saffron spices. Served with salan and raita.',
    pricePaise: 24000,
    available: true,
    category: 'Biryani'
  },
  {
    id: 'item-biryani-002',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Tikka Biryani',
    description: 'Smoky tandoori paneer cubes nestled in aromatic dum spiced basmati rice.',
    pricePaise: 28000,
    available: true,
    category: 'Biryani'
  },
  {
    id: 'item-starter-001',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Malai Tikka',
    description: 'Tender cottage cheese marinated in fresh cream, mild spices, and char-grilled.',
    pricePaise: 22000,
    available: true,
    category: 'Starters'
  },
  {
    id: 'item-bread-001',
    restaurantId: 'rest-spice-box',
    name: 'Butter Garlic Naan',
    description: 'Fluffy clay-oven baked bread brushed with butter and minced roasted garlic.',
    pricePaise: 6000,
    available: true,
    category: 'Breads'
  },

  // Madras Tiffin Room
  {
    id: 'item-dosa-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Ghee Roast Masala Dosa',
    description: 'Golden crisp fermented crepe roasted with pure desi ghee, filled with spiced potato mash.',
    pricePaise: 14000,
    available: true,
    category: 'Tiffin'
  },
  {
    id: 'item-dosa-002',
    restaurantId: 'rest-dosa-corner',
    name: 'Steamed Idli Sambar (2 pcs)',
    description: 'Pillow-soft steamed rice cakes drenched in piping hot lentil vegetable stew.',
    pricePaise: 9000,
    available: true,
    category: 'Tiffin'
  },
  {
    id: 'item-beverage-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Filter Kaapi',
    description: 'Traditional South Indian chicory blend filter coffee served foaming hot.',
    pricePaise: 5000,
    available: true,
    category: 'Beverages'
  },

  // Dragon Wok Express
  {
    id: 'item-wok-001',
    restaurantId: 'rest-wok-express',
    name: 'Hakka Chilli Garlic Noodles',
    description: 'Wok-tossed noodles tossed with bell peppers, cabbage, and homemade chili-garlic paste.',
    pricePaise: 21000,
    available: true,
    category: 'Noodles'
  },
  {
    id: 'item-wok-002',
    restaurantId: 'rest-wok-express',
    name: 'Crispy Veg Dimsums (6 pcs)',
    description: 'Steamed then pan-crisped dumplings served with fiery chili dip.',
    pricePaise: 18000,
    available: true,
    category: 'Appetizers'
  }
];
