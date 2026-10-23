import { MenuItemLookup } from './domain.js';

// Default menu items for mock/fallback lookup (mirrors restaurant service seed data)
export const DEFAULT_MENU_ITEMS: Record<string, MenuItemLookup> = {
  'item-biryani-001': {
    id: 'item-biryani-001',
    restaurantId: 'rest-spice-box',
    name: 'Royal Veg Dum Biryani',
    pricePaise: 24000,
    available: true
  },
  'item-biryani-002': {
    id: 'item-biryani-002',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Tikka Biryani',
    pricePaise: 28000,
    available: true
  },
  'item-starter-001': {
    id: 'item-starter-001',
    restaurantId: 'rest-spice-box',
    name: 'Paneer Malai Tikka',
    pricePaise: 22000,
    available: true
  },
  'item-bread-001': {
    id: 'item-bread-001',
    restaurantId: 'rest-spice-box',
    name: 'Butter Garlic Naan',
    pricePaise: 6000,
    available: true
  },
  'item-dosa-001': {
    id: 'item-dosa-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Ghee Roast Masala Dosa',
    pricePaise: 14000,
    available: true
  },
  'item-dosa-002': {
    id: 'item-dosa-002',
    restaurantId: 'rest-dosa-corner',
    name: 'Steamed Idli Sambar (2 pcs)',
    pricePaise: 9000,
    available: true
  },
  'item-beverage-001': {
    id: 'item-beverage-001',
    restaurantId: 'rest-dosa-corner',
    name: 'Filter Kaapi',
    pricePaise: 5000,
    available: true
  },
  'item-wok-001': {
    id: 'item-wok-001',
    restaurantId: 'rest-wok-express',
    name: 'Hakka Chilli Garlic Noodles',
    pricePaise: 21000,
    available: true
  },
  'item-wok-002': {
    id: 'item-wok-002',
    restaurantId: 'rest-wok-express',
    name: 'Crispy Veg Dimsums (6 pcs)',
    pricePaise: 18000,
    available: true
  },
  'item-unavailable-demo': {
    id: 'item-unavailable-demo',
    restaurantId: 'rest-spice-box',
    name: 'Seasonal Mango Kulfi',
    pricePaise: 12000,
    available: false
  }
};

export type MenuItemResolver = (itemId: string) => Promise<MenuItemLookup | undefined> | MenuItemLookup | undefined;

export function createDefaultResolver(
  customItems?: Record<string, MenuItemLookup>
): MenuItemResolver {
  const table = customItems || DEFAULT_MENU_ITEMS;
  return (itemId: string) => table[itemId];
}
