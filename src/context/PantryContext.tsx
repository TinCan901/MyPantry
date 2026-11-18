import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
    DEFAULT_PANTRY,
    STORAGE_KEYS,
} from '../constants/pantryDefaults';
import {
    DislikedRecipe,
    PantryCategory,
    PantryItem,
    Recipe,
    ShoppingItem,
} from '../types/pantry';
import {
    cleanIngredientName,
    findMatchingPantryItem,
    formatPantryQty,
} from '../utils/pantryMath';
import {
    addLocalSideToRecipe,
    generateLocalRecipes,
    updateLocalRecipe,
} from '../utils/localRecipeGenerator';

export interface GenerateOptions {
  mealType: string;
  cookingType: string;
  maxCarbs: string;
  pantryMode: string;
  craving: string;
}

interface PantryContextValue {
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  recipes: Recipe[];
  savedRecipes: Recipe[];
  dislikedRecipes: DislikedRecipe[];
  activeModelBadge: string;
  isGenerating: boolean;
  elapsedSeconds: number;
  aiError: string | null;
  lastCookingType: string;

  // Modals & Toast
  settingsVisible: boolean;
  setSettingsVisible: (visible: boolean) => void;
  cookedTarget: { mealId: string; isSavedTab: boolean } | null;
  openCookedModal: (mealId: string, isSavedTab: boolean) => void;
  closeCookedModal: () => void;
  toast: { message: string; canUndo: boolean } | null;
  showToast: (message: string, canUndo?: boolean) => void;

  // Settings & Backup
  exportData: () => Promise<void>;
  importData: () => Promise<void>;

  // Pantry Actions
  addPantryItem: (params: {
    name: string;
    category: PantryCategory;
    amount: string;
    unit: string;
    container: string;
    count: string;
  }) => void;
  updatePantryItem: (
    id: string,
    params: {
      name: string;
      category: PantryCategory;
      amount: string;
      unit: string;
      container: string;
      count: string;
    }
  ) => void;
  markItemFinished: (id: string) => void;
  undoLastFinish: () => void;
  applyCookedDeductions: (
    updates: { pantryId: string; newQty: string; isOut: boolean }[]
  ) => void;

  // Shopping Actions
  addManualShoppingItem: (name: string) => void;
  addMissingIngredientToShop: (rawIngredient: string) => void;
  toggleShoppingItem: (id: string) => void;
  restockChecked: () => void;
  clearCheckedShopping: () => void;

  // Recipe & AI Actions
  isIngredientInPantry: (ingredientText: string) => boolean;
  isIngredientOnShoppingList: (ingredientText: string) => boolean;
  generateMeals: (opts: GenerateOptions) => Promise<void>;
  saveRecipeToFavorites: (id: string) => void;
  removeSavedRecipe: (id: string) => void;
  dislikeRecipe: (id: string) => void;
  unbanDislikedRecipe: (index: number) => void;
  addSideToRecipe: (
    mealId: string,
    sideIndex: number,
    isSavedTab: boolean
  ) => Promise<void>;
  applyRecipeNote: (
    mealId: string,
    noteText: string,
    isSavedTab: boolean
  ) => Promise<boolean>;
}

const PantryContext = createContext<PantryContextValue | null>(null);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [pantry, setPantry] = useState<PantryItem[]>(DEFAULT_PANTRY);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [dislikedRecipes, setDislikedRecipes] = useState<DislikedRecipe[]>([]);
  const activeModelBadge = 'Built-in · Offline';
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastCookingType, setLastCookingType] = useState('Any');

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [cookedTarget, setCookedTarget] = useState<{
    mealId: string;
    isSavedTab: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; canUndo: boolean } | null>(null);
  const [lastFinishedItem, setLastFinishedItem] = useState<PantryItem | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [p, s, r, sv, d] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PANTRY),
          AsyncStorage.getItem(STORAGE_KEYS.SHOPPING),
          AsyncStorage.getItem(STORAGE_KEYS.RECIPES),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED),
          AsyncStorage.getItem(STORAGE_KEYS.DISLIKED),
        ]);

        if (p !== null) setPantry(JSON.parse(p));
        if (s !== null) setShoppingList(JSON.parse(s));
        if (r !== null) setRecipes(JSON.parse(r));
        if (sv !== null) setSavedRecipes(JSON.parse(sv));
        if (d !== null) setDislikedRecipes(JSON.parse(d));
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist changes
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantry));
  }, [pantry, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(shoppingList));
  }, [shoppingList, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedRecipes));
  }, [savedRecipes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.DISLIKED, JSON.stringify(dislikedRecipes));
  }, [dislikedRecipes, hydrated]);

  const showToast = (message: string, canUndo = false) => {
    setToast({ message, canUndo });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  // Settings & Backup
  const exportData = async () => {
    try {
      const payload = {
        pantry,
        shoppingList,
        recipes,
        savedRecipes,
        dislikedRecipes,
        exportedAt: new Date().toISOString(),
      };
      const file = new File(Paths.cache, 'pantryprep-backup.json');
      file.write(JSON.stringify(payload, null, 2));
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export PantryPrep Backup',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not export backup JSON.');
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const pickedFile = new File(result.assets[0].uri);
      const raw = await pickedFile.text();
      const data = JSON.parse(raw);

      if (Array.isArray(data.pantry)) setPantry(data.pantry);
      if (Array.isArray(data.shoppingList)) setShoppingList(data.shoppingList);
      if (Array.isArray(data.recipes)) setRecipes(data.recipes);
      if (Array.isArray(data.savedRecipes)) setSavedRecipes(data.savedRecipes);
      if (Array.isArray(data.dislikedRecipes)) setDislikedRecipes(data.dislikedRecipes);

      showToast('Backup imported successfully');
    } catch {
      Alert.alert('Import Failed', 'Invalid backup JSON file.');
    }
  };

  // Pantry Logic
  const addPantryItem = ({
    name,
    category,
    amount,
    unit,
    container,
    count,
  }: {
    name: string;
    category: PantryCategory;
    amount: string;
    unit: string;
    container: string;
    count: string;
  }) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const qty = formatPantryQty(amount, unit, container, count);
    setPantry((prev) => [
      { id: Date.now().toString(), name: cleanName, category, qty },
      ...prev,
    ]);
  };

  const updatePantryItem = (
    id: string,
    {
      name,
      category,
      amount,
      unit,
      container,
      count,
    }: {
      name: string;
      category: PantryCategory;
      amount: string;
      unit: string;
      container: string;
      count: string;
    }
  ) => {
    const cleanName = name.trim();
    const qty = formatPantryQty(amount, unit, container, count);
    setPantry((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: cleanName || item.name, category, qty }
          : item
      )
    );
    showToast(`Updated "${cleanName}"`);
  };

  const markItemFinished = (id: string) => {
    const finished = pantry.find((item) => item.id === id);
    if (!finished) return;

    setPantry((prev) => prev.filter((item) => item.id !== id));
    setLastFinishedItem(finished);

    setShoppingList((prev) => {
      const exists = prev.some(
        (s) => s.name.toLowerCase() === finished.name.toLowerCase()
      );
      if (exists) return prev;
      return [
        {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
          name: finished.name,
          category: finished.category,
          source: 'Finished in Pantry',
          checked: false,
        },
        ...prev,
      ];
    });

    showToast(`"${finished.name}" moved to Shopping List`, true);
  };

  const undoLastFinish = () => {
    if (!lastFinishedItem) return;
    setPantry((prev) => [lastFinishedItem, ...prev]);
    setShoppingList((prev) =>
      prev.filter((s) => s.name.toLowerCase() !== lastFinishedItem.name.toLowerCase())
    );
    setLastFinishedItem(null);
    setToast(null);
  };

  const openCookedModal = (mealId: string, isSavedTab: boolean) => {
    const list = isSavedTab ? savedRecipes : recipes;
    const meal = list.find((m) => m.id === mealId);
    if (!meal) return;

    const hasMatch = (meal.ingredients || []).some((ing) =>
      findMatchingPantryItem(pantry, ing)
    );
    if (!hasMatch) {
      showToast('No ingredients from this recipe are currently in your pantry');
      return;
    }

    setCookedTarget({ mealId, isSavedTab });
  };

  const closeCookedModal = () => setCookedTarget(null);

  const applyCookedDeductions = (
    updates: { pantryId: string; newQty: string; isOut: boolean }[]
  ) => {
    const outIds = new Set<string>();
    const qtyUpdates = new Map<string, string>();

    updates.forEach((u) => {
      const trimmed = u.newQty.trim();
      const isZero = u.isOut || /^0(\.0+)?\s*[a-z]*$/i.test(trimmed);
      if (isZero) {
        outIds.add(u.pantryId);
      } else if (trimmed) {
        qtyUpdates.set(u.pantryId, trimmed);
      }
    });

    const finishedItems = pantry.filter((p) => outIds.has(p.id));

    setPantry((prev) =>
      prev
        .filter((p) => !outIds.has(p.id))
        .map((p) => (qtyUpdates.has(p.id) ? { ...p, qty: qtyUpdates.get(p.id)! } : p))
    );

    if (finishedItems.length > 0) {
      setShoppingList((prev) => {
        const next = [...prev];
        finishedItems.forEach((f, idx) => {
          if (!next.some((s) => s.name.toLowerCase() === f.name.toLowerCase())) {
            next.unshift({
              id: `${Date.now()}_${idx}`,
              name: f.name,
              category: f.category,
              source: 'Finished in Pantry',
              checked: false,
            });
          }
        });
        return next;
      });
    }

    closeCookedModal();
    showToast('Pantry quantities updated after cooking!');
  };

  // Shopping Logic
  const addManualShoppingItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShoppingList((prev) => [
      {
        id: Date.now().toString(),
        name: trimmed,
        category: 'General',
        source: 'Manual Entry',
        checked: false,
      },
      ...prev,
    ]);
  };

  const addMissingIngredientToShop = (rawIngredient: string) => {
    const cleaned = cleanIngredientName(rawIngredient);
    if (shoppingList.some((s) => s.name.toLowerCase() === cleaned.toLowerCase())) {
      return;
    }
    setShoppingList((prev) => [
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
        name: cleaned,
        category: 'Meal Prep',
        source: 'Recipe Ingredient',
        checked: false,
      },
      ...prev,
    ]);
    showToast(`Added "${cleaned}" to Shopping List`);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const restockChecked = () => {
    const checkedItems = shoppingList.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    const restocked: PantryItem[] = checkedItems.map((item, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      name: item.name,
      category: (item.category === 'Meal Prep' || item.category === 'General'
        ? 'Pantry & Spices'
        : item.category) as PantryCategory,
      qty: 'Restocked',
    }));

    setPantry((prev) => [...restocked, ...prev]);
    setShoppingList((prev) => prev.filter((i) => !i.checked));
    showToast(`Restocked ${checkedItems.length} item(s) to My Pantry`);
  };

  const clearCheckedShopping = () => {
    setShoppingList((prev) => prev.filter((i) => !i.checked));
  };

  // Matching helpers
  const isIngredientInPantry = (ingredientText: string) =>
    !!findMatchingPantryItem(pantry, ingredientText);

  const isIngredientOnShoppingList = (ingredientText: string) => {
    const cleanIng = ingredientText.toLowerCase();
    return shoppingList.some(
      (s) =>
        cleanIng.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(cleanIng)
    );
  };

  // Generate recipes locally so meal suggestions work offline without an account or API key.
  const generateMeals = async ({
    mealType,
    cookingType,
    maxCarbs,
    pantryMode,
    craving,
  }: GenerateOptions) => {
    setLastCookingType(cookingType);
    setIsGenerating(true);
    setAiError(null);
    setElapsedSeconds(0);

    const timerId = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const parsedMeals = generateLocalRecipes(
        pantry,
        { mealType, cookingType, maxCarbs, pantryMode, craving },
        dislikedRecipes.map((item) => item.title)
      );

      setRecipes(
        parsedMeals.map((m, idx) => ({
          ...m,
          id: `${Date.now()}${idx}`,
        }))
      );
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate meals.');
    } finally {
      clearInterval(timerId);
      setIsGenerating(false);
    }
  };

  const saveRecipeToFavorites = (id: string) => {
    const meal = recipes.find((r) => r.id === id);
    if (!meal) return;

    if (savedRecipes.some((s) => s.title.toLowerCase() === meal.title.toLowerCase())) {
      showToast('Recipe is already in Saved Recipes');
      return;
    }

    setSavedRecipes((prev) => [{ ...meal, id: Date.now().toString() }, ...prev]);
    showToast(`Saved "${meal.title}"`);
  };

  const removeSavedRecipe = (id: string) => {
    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    showToast('Removed from Saved Recipes');
  };

  const dislikeRecipe = (id: string) => {
    const meal = recipes.find((r) => r.id === id);
    if (!meal) return;

    setDislikedRecipes((prev) => {
      if (prev.some((d) => d.title.toLowerCase() === meal.title.toLowerCase())) {
        return prev;
      }
      return [
        { title: meal.title, dislikedAt: new Date().toLocaleDateString() },
        ...prev,
      ];
    });

    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSavedRecipes((prev) =>
      prev.filter((s) => s.title.toLowerCase() !== meal.title.toLowerCase())
    );
    showToast(`Disliked "${meal.title}" — we’ll avoid it in future ideas`);
  };

  const unbanDislikedRecipe = (index: number) => {
    setDislikedRecipes((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Removed from disliked list');
  };

  const addSideToRecipe = async (
    mealId: string,
    sideIndex: number,
    isSavedTab: boolean
  ) => {
    const list = isSavedTab ? savedRecipes : recipes;
    const meal = list.find((m) => m.id === mealId);
    const sideName = meal?.serveWith?.[sideIndex];
    if (!meal || !sideName) return;

    const result = addLocalSideToRecipe(meal, sideName, pantry, lastCookingType);
    const applyUpdate = (items: Recipe[]) =>
      items.map((item) =>
        item.id === mealId
          ? {
              ...item,
              title: result.title,
              netCarbs: (Number(item.netCarbs) || 0) + result.addedCarbs,
              protein: (Number(item.protein) || 0) + result.addedProtein,
              calories: (Number(item.calories) || 0) + result.addedCalories,
              ingredients: [...item.ingredients, ...result.sideIngredients],
              steps: [...item.steps, ...result.sideSteps],
              addedSides: [...(item.addedSides || []), sideName],
            }
          : item
      );

    if (isSavedTab) {
      setSavedRecipes(applyUpdate);
    } else {
      setRecipes(applyUpdate);
    }
    showToast(`Added "${sideName}" to your recipe!`);
  };

  const applyRecipeNote = async (
    mealId: string,
    noteText: string,
    isSavedTab: boolean
  ): Promise<boolean> => {
    const cleanNote = noteText.trim();
    const list = isSavedTab ? savedRecipes : recipes;
    const meal = list.find((m) => m.id === mealId);
    if (!meal || !cleanNote) return false;

    const changes = updateLocalRecipe(meal, cleanNote, pantry);
    const applyUpdate = (items: Recipe[]) =>
      items.map((item) => (item.id === mealId ? { ...item, ...changes } : item));

    if (isSavedTab) {
      setSavedRecipes(applyUpdate);
    } else {
      setRecipes(applyUpdate);
    }

    showToast(`Recipe updated: "${cleanNote}"`);
    return true;
  };

  return (
    <PantryContext.Provider
      value={{
        pantry,
        shoppingList,
        recipes,
        savedRecipes,
        dislikedRecipes,
        activeModelBadge,
        isGenerating,
        elapsedSeconds,
        aiError,
        lastCookingType,
        settingsVisible,
        setSettingsVisible,
        cookedTarget,
        openCookedModal,
        closeCookedModal,
        toast,
        showToast,
        exportData,
        importData,
        addPantryItem,
        updatePantryItem,
        markItemFinished,
        undoLastFinish,
        applyCookedDeductions,
        addManualShoppingItem,
        addMissingIngredientToShop,
        toggleShoppingItem,
        restockChecked,
        clearCheckedShopping,
        isIngredientInPantry,
        isIngredientOnShoppingList,
        generateMeals,
        saveRecipeToFavorites,
        removeSavedRecipe,
        dislikeRecipe,
        unbanDislikedRecipe,
        addSideToRecipe,
        applyRecipeNote,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
}

export function usePantry() {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error('usePantry must be used within PantryProvider');
  return ctx;
}