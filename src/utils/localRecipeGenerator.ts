import { PantryItem, Recipe } from '../types/pantry';

export interface LocalRecipeOptions {
  mealType: string;
  cookingType: string;
  maxCarbs: string;
  pantryMode: string;
  craving: string;
}

const proteinFallbacks = [
  'Chicken',
  'Minced Beef',
  'Eggs',
  'Tuna',
  'Salmon',
  'Pork',
  'Tofu',
];
const vegetableFallbacks = [
  'Baby Spinach',
  'Zucchini',
  'Cauliflower',
  'Broccoli',
  'Mushrooms',
  'Bell Pepper',
  'Cabbage',
];
const flavorProfiles = [
  { name: 'Garlic Herb', seasoning: 'garlic and dried herbs' },
  { name: 'Smoky Paprika', seasoning: 'smoked paprika and black pepper' },
  { name: 'Lemon Pepper', seasoning: 'lemon zest and black pepper' },
];

interface RecipeIngredient {
  name: string;
  category?: PantryItem['category'];
}

function findPantryItem(pantry: PantryItem[], term: string) {
  const normalized = term.toLowerCase().replace(/s$/, '');
  return pantry.find((item) => {
    const name = item.name.toLowerCase();
    return name.includes(normalized) || normalized.includes(name.replace(/s$/, ''));
  });
}

function choosePantryOrFallback(
  pantry: PantryItem[],
  category: PantryItem['category'],
  fallbacks: string[],
  index: number,
  pantryOnly: boolean
): RecipeIngredient | undefined {
  const categoryItems = pantry.filter((item) => item.category === category);
  if (categoryItems.length > 0) return categoryItems[index % categoryItems.length];
  if (pantryOnly) return undefined;
  const name = fallbacks[index % fallbacks.length];
  return { name, category };
}

function ingredientLine(name: string, quantity: string) {
  return `${quantity} ${name}`;
}

function methodSteps(
  cookingType: string,
  proteinName: string,
  vegetableName: string,
  pantryOnly: boolean,
  oilAvailable: boolean
) {
  const isEggBased = /egg/i.test(proteinName);
  const seasoning = pantryOnly ? 'the listed seasonings' : 'salt, pepper, and the chosen seasonings';
  const oil = pantryOnly
    ? oilAvailable
      ? 'a little of the listed oil'
      : 'a non-stick pan'
    : 'a little oil';
  const panPrep =
    pantryOnly && !oilAvailable
    ? 'Heat a large non-stick pan over medium heat.'
    : `Warm ${oil} in a large pan over medium heat.`;
  if (isEggBased && cookingType === 'Stove') {
    return [
    `Slice ${vegetableName} and cook it in a pan over medium heat until tender.`,
    `Whisk the eggs with ${seasoning}, pour into the pan, and stir gently until softly set.`,
    'Cook until the eggs are fully set, then serve warm.',
    ];
  }
  if (isEggBased) {
    const temperature =
    cookingType === 'Airfryer'
      ? '160°C'
      : cookingType === 'Convection Oven'
        ? '170°C'
        : '180°C';
    const appliance = cookingType === 'Airfryer' ? 'air-fryer' : 'oven';
    return [
    `Heat the ${appliance} to ${temperature}. Whisk the eggs with ${seasoning}.`,
    `Fold in sliced ${vegetableName} and pour into a small oven-safe dish.`,
    `Bake for 12–18 minutes, until the center is fully set.`,
    ];
  }
  if (cookingType === 'Airfryer') {
    return [
      `Cut ${proteinName} into even pieces and season with ${seasoning}${oilAvailable || !pantryOnly ? ` and ${oil}` : ''}.`,
      `Air-fry at 190°C for 10 minutes, shaking the basket halfway through.`,
      `Add sliced ${vegetableName} and air-fry for 8–12 minutes more, until the protein is cooked through and the vegetables are tender.`,
      'Check that the protein is cooked through (poultry should reach 74°C in the thickest part). Rest for 3 minutes, then serve.',
    ];
  }
  if (cookingType === 'Oven' || cookingType === 'Convection Oven') {
    const temperature = cookingType === 'Convection Oven' ? '190°C' : '200°C (180°C fan)';
    return [
      `Heat the ${cookingType.toLowerCase()} to ${temperature}. Cut ${proteinName} and ${vegetableName} into even pieces.`,
      `Arrange everything in a baking dish${oilAvailable || !pantryOnly ? ` with ${oil}` : ''} and season with ${seasoning}.`,
      'Bake for 20–25 minutes, stirring once, until the vegetables are tender and the protein is cooked through.',
      'Check that the protein is cooked through (poultry should reach 74°C in the thickest part). Rest for 3 minutes before serving.',
    ];
  }
  return [
    `Cut ${proteinName} and ${vegetableName} into bite-size pieces. ${panPrep}`,
    `Cook ${proteinName} for 5–7 minutes, turning occasionally, until browned and cooked through.`,
    `Add ${vegetableName} and ${seasoning}. Stir-fry for 5–8 minutes until tender-crisp.`,
    'Check that the protein is cooked through (poultry should reach 74°C in the thickest part). Taste, adjust seasoning, and serve warm.',
  ];
}

export function generateLocalRecipes(
  pantry: PantryItem[],
  options: LocalRecipeOptions,
  dislikedTitles: string[]
): Omit<Recipe, 'id'>[] {
  const pantryOnly = options.pantryMode === 'strict';
  const maxCarbs = Number.parseInt(options.maxCarbs, 10) || 20;
  const craving = options.craving.trim();
  const disliked = new Set(dislikedTitles.map((title) => title.toLowerCase()));

  return flavorProfiles.map((flavor, index) => {
    const protein =
      (craving && findPantryItem(pantry, craving)) ||
      choosePantryOrFallback(pantry, 'Protein', proteinFallbacks, index, pantryOnly);
    const vegetable = choosePantryOrFallback(
      pantry,
      'Low-Carb Veggies',
      vegetableFallbacks,
      index,
      pantryOnly
    );
    const dairy = choosePantryOrFallback(
      pantry,
      'Dairy & Eggs',
      ['Feta', 'Cheddar Cheese', 'Eggs'],
      index,
      pantryOnly
    );
    const mainProtein = protein || dairy;
    const selectedProtein: RecipeIngredient = mainProtein || { name: 'Seasonal vegetables' };
    const selectedVegetable: RecipeIngredient = vegetable || dairy || { name: 'available vegetables' };
    const proteinName = selectedProtein.name;
    const vegetableName = selectedVegetable.name;
    const title = `${flavor.name} ${proteinName} ${options.mealType}`;
    const pantrySeasonings = pantry
      .filter((item) => item.category === 'Pantry & Spices')
      .slice(0, 2)
      .map((item) => item.name);
    const seasoningIngredients = pantryOnly
      ? pantrySeasonings
      : [flavor.seasoning];
    const oilIngredient = pantryOnly
      ? pantry.find((item) => /oil/i.test(item.name))?.name
      : 'olive oil';
    const saltIngredient = pantryOnly
      ? pantry.find((item) => /salt/i.test(item.name))?.name
      : 'Salt to taste';
    const ingredients = [
      mainProtein &&
        ingredientLine(
          mainProtein.name,
          mainProtein.category === 'Dairy & Eggs' && /egg/i.test(mainProtein.name)
            ? '2'
            : '450g'
        ),
      vegetable && ingredientLine(vegetableName, '250g'),
      dairy && dairy.name !== proteinName && ingredientLine(dairy.name, '40g'),
      ...seasoningIngredients,
      oilIngredient && `1 tbsp ${oilIngredient}`,
      saltIngredient,
    ].filter((item): item is string => !!item);

    if (craving && !findPantryItem(pantry, craving) && !pantryOnly) {
      ingredients.unshift(`200g ${craving}`);
    }

    const carbEstimate = Math.max(3, Math.min(maxCarbs, 5 + (vegetable ? 3 : 0)));
    const safeTitle = disliked.has(title.toLowerCase())
      ? `${flavor.name} ${proteinName} Skillet`
      : title;

    return {
      title: safeTitle,
      prepTime: options.cookingType === 'Any' ? '25 mins' : '30 mins',
      servings: 2,
      netCarbs: carbEstimate,
      protein: mainProtein?.category === 'Protein' ? 34 : 18,
      calories: mainProtein?.category === 'Protein' ? 390 : 300,
      ingredients,
      steps: methodSteps(
        options.cookingType,
        proteinName,
        vegetableName,
        pantryOnly,
        !!oilIngredient
      ),
      serveWith: [
        'Crisp green salad',
        'Herbed cauliflower mash',
        'Roasted seasonal vegetables',
      ],
      storageTip: 'Refrigerate in a sealed container for up to 3 days. Reheat until steaming hot.',
    };
  });
}

export function addLocalSideToRecipe(
  recipe: Recipe,
  sideName: string,
  pantry: PantryItem[],
  cookingType: string
) {
  const sidePantryItem = pantry.find((item) =>
    sideName.toLowerCase().includes(item.name.toLowerCase())
  );
  const sideIngredient = sidePantryItem?.name || sideName;
  const sideSteps =
    cookingType === 'Airfryer'
      ? [`Air-fry ${sideIngredient} at 190°C for 10–15 minutes, shaking once, until tender and lightly browned.`]
      : cookingType === 'Oven' || cookingType === 'Convection Oven'
        ? [`Roast ${sideIngredient} at ${cookingType === 'Oven' ? '200°C (180°C fan)' : '190°C'} for 20–25 minutes until tender.`]
        : [`Prepare ${sideIngredient} in a pan over medium heat for 8–10 minutes, stirring occasionally, until tender.`];

  return {
    title: `${recipe.title} with ${sideName}`,
    addedCarbs: 3,
    addedProtein: 2,
    addedCalories: 80,
    sideIngredients: [`250g ${sideIngredient}`, '1 tsp olive oil', 'Salt and pepper to taste'],
    sideSteps,
  };
}

export function updateLocalRecipe(
  recipe: Recipe,
  note: string,
  pantry: PantryItem[]
): Partial<Recipe> {
  const cleanNote = note.trim();
  let ingredients = [...recipe.ingredients];
  let steps = [...recipe.steps];
  const replaceMatch = cleanNote.match(/(?:replace|swap)\s+(.+?)\s+(?:with|for)\s+(.+)/i);
  const removeMatch = cleanNote.match(/(?:remove|without|no)\s+(.+)/i);

  if (/dairy.free|without dairy/i.test(cleanNote)) {
    ingredients = ingredients.filter((item) => !/cheese|cream|butter|yogurt|milk/i.test(item));
  } else if (replaceMatch) {
    const [, oldIngredient, newIngredient] = replaceMatch;
    const matchIndex = ingredients.findIndex((item) =>
      item.toLowerCase().includes(oldIngredient.trim().toLowerCase())
    );
    if (matchIndex >= 0) {
      const oldValue = oldIngredient.trim();
      const newValue = newIngredient.trim();
      const ingredient = ingredients[matchIndex];
      const start = ingredient.toLowerCase().indexOf(oldValue.toLowerCase());
      ingredients[matchIndex] =
        ingredient.slice(0, start) + newValue + ingredient.slice(start + oldValue.length);
      steps = steps.map((step) => {
        const stepStart = step.toLowerCase().indexOf(oldValue.toLowerCase());
        return stepStart < 0
          ? step
          : step.slice(0, stepStart) + newValue + step.slice(stepStart + oldValue.length);
      });
    } else {
      ingredients.push(newIngredient.trim());
    }
  } else if (removeMatch) {
    const unwanted = removeMatch[1].trim().toLowerCase();
    ingredients = ingredients.filter((item) => !item.toLowerCase().includes(unwanted));
  } else {
    const pantryIngredient = pantry.find((item) =>
      cleanNote.toLowerCase().includes(item.name.toLowerCase())
    );
    const mentionedIngredient = pantryIngredient?.name;
    if (mentionedIngredient && !ingredients.some((item) =>
      item.toLowerCase().includes(mentionedIngredient.toLowerCase())
    )) {
      ingredients.push(`To taste: ${mentionedIngredient}`);
      steps[steps.length - 1] = `${steps[steps.length - 1]} Add ${mentionedIngredient} to taste.`;
    } else if (/spicy|spicier|chilli|chili/i.test(cleanNote)) {
      ingredients.push('Chilli flakes to taste');
      steps[steps.length - 1] = `${steps[steps.length - 1]} Add chilli flakes to taste.`;
    } else {
      steps[steps.length - 1] = `${steps[steps.length - 1]} Adjust to your note: ${cleanNote}.`;
    }
  }

  return {
    ingredients,
    steps,
    userNotes: [...(recipe.userNotes || []), cleanNote],
  };
}
