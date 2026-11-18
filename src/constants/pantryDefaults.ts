import { ContainerType, PantryCategory, PantryItem, UnitType } from '../types/pantry';

export const STORAGE_KEYS = {
  PANTRY: 'pantryprep_pantry_v1',
  SHOPPING: 'pantryprep_shopping_v1',
  RECIPES: 'pantryprep_recipes_v1',
  SAVED: 'pantryprep_saved_v1',
  DISLIKED: 'pantryprep_disliked_v1',
} as const;

export const PANTRY_CATEGORIES: PantryCategory[] = [
  'Protein',
  'Low-Carb Veggies',
  'Dairy & Eggs',
  'Fats & Oils',
  'Pantry & Spices',
];

export const UNIT_OPTIONS: UnitType[] = ['g', 'kg', 'ml', 'l', 'pcs'];

export const CONTAINER_OPTIONS: ContainerType[] = [
  'Pack',
  'Bag',
  'Bottle',
  'Can',
  'Box',
  'Jar',
  '',
];

export const DEFAULT_PANTRY: PantryItem[] = [
  { id: '1', name: 'Chicken Breasts', category: 'Protein', qty: '1 kg' },
  { id: '2', name: 'Baby Spinach', category: 'Low-Carb Veggies', qty: '200g bag' },
  { id: '3', name: 'Eggs', category: 'Dairy & Eggs', qty: '12 large' },
  { id: '4', name: 'Baby Marrows / Zucchini', category: 'Low-Carb Veggies', qty: '4 medium' },
  { id: '5', name: 'Minced Beef', category: 'Protein', qty: '500g' },
  { id: '6', name: 'Cheddar Cheese', category: 'Dairy & Eggs', qty: '250g' },
  { id: '7', name: 'Olive Oil', category: 'Fats & Oils', qty: '1 bottle' },
  { id: '8', name: 'Garlic', category: 'Pantry & Spices', qty: '1 bulb' },
  { id: '9', name: 'Avocado', category: 'Fats & Oils', qty: '2 ripe' },
  { id: '10', name: 'Cauliflower', category: 'Low-Carb Veggies', qty: '1 head' },
];