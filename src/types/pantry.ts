export type PantryCategory =
  | 'Protein'
  | 'Low-Carb Veggies'
  | 'Dairy & Eggs'
  | 'Fats & Oils'
  | 'Pantry & Spices';

export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export type ContainerType = 'Pack' | 'Bag' | 'Bottle' | 'Can' | 'Box' | 'Jar' | '';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  qty: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  source: string;
  checked: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  servings: number;
  netCarbs?: number;
  protein?: number;
  calories?: number;
  category?: 'meal' | 'baking';
  source?: 'ai';
  ingredients: string[];
  steps: string[];
  serveWith?: string[];
  addedSides?: string[];
  userNotes?: string[];
  storageTip?: string;
}

export interface DislikedRecipe {
  title: string;
  dislikedAt: string;
}

export interface CookedDeductionMatch {
  pantryId: string;
  pantryName: string;
  oldQty: string;
  ingredientUsed: string;
  suggestedQty: string;
  isZero: boolean;
}