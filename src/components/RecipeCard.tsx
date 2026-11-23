import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { usePantry } from '../context/PantryContext';
import { Recipe } from '../types/pantry';

interface RecipeCardProps {
  meal: Recipe;
  isSavedTab: boolean;
}

export function RecipeCard({ meal, isSavedTab }: RecipeCardProps) {
  const {
    savedRecipes,
    isIngredientInPantry,
    isIngredientOnShoppingList,
    addMissingIngredientToShop,
    openCookedModal,
    saveRecipeToFavorites,
    removeSavedRecipe,
    dislikeRecipe,
    addSideToRecipe,
    applyRecipeNote,
  } = usePantry();

  const [loadingSideIdx, setLoadingSideIdx] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [updatingNote, setUpdatingNote] = useState(false);

  const isAlreadySaved = savedRecipes.some(
    (s) => s.title.toLowerCase() === meal.title.toLowerCase()
  );

  const handleAddSide = async (idx: number) => {
    setLoadingSideIdx(idx);
    try {
      await addSideToRecipe(meal.id, idx, isSavedTab);
    } finally {
      setLoadingSideIdx(null);
    }
  };

  const handleUpdateNote = async () => {
    if (!noteInput.trim()) return;
    setUpdatingNote(true);
    try {
      const ok = await applyRecipeNote(meal.id, noteInput, isSavedTab);
      if (ok) setNoteInput('');
    } finally {
      setUpdatingNote(false);
    }
  };

  return (
    <View className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm gap-5 mb-4">
      {/* Title & Macros */}
      <View className="border-b border-slate-100 pb-4 gap-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-xl font-extrabold text-slate-900 leading-6">
              {meal.title}
            </Text>
            <Text className="text-sm text-slate-500 mt-1.5">
              {meal.category === 'baking' ? 'Baking · ' : ''}
              {meal.prepTime ? `${meal.prepTime} · ` : ''}
              {meal.servings} {meal.servings === 1 ? 'serving' : 'servings'}
            </Text>
          </View>

          {meal.netCarbs != null && (
            <View className="px-3 py-2 rounded-2xl bg-emerald-50">
              <Text className="text-sm font-bold text-emerald-800">
                {meal.netCarbs}g Carbs
              </Text>
            </View>
          )}
        </View>

        {(meal.protein != null || meal.calories != null) && (
          <View className="flex-row flex-wrap gap-2">
            {meal.protein != null && (
              <View className="px-3 py-2 rounded-xl bg-slate-50">
                <Text className="text-sm text-slate-600 font-medium">{meal.protein}g Protein</Text>
              </View>
            )}
            {meal.calories != null && (
              <View className="px-3 py-2 rounded-xl bg-slate-50">
                <Text className="text-sm text-slate-600 font-medium">{meal.calories} kcal</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 pt-1">
          <Pressable
            onPress={() => openCookedModal(meal.id, isSavedTab)}
            className="flex-1 min-h-11 rounded-xl bg-emerald-700 active:bg-emerald-800 items-center justify-center shadow-sm"
          >
            <Text className="text-sm text-white font-bold">Mark cooked</Text>
          </Pressable>

          {isSavedTab ? (
            <Pressable
              onPress={() => removeSavedRecipe(meal.id)}
              className="min-h-11 px-4 rounded-xl border border-rose-100 bg-rose-50 items-center justify-center"
            >
              <Text className="text-sm text-rose-700 font-bold">Remove</Text>
            </Pressable>
          ) : (
            <>
              {!isAlreadySaved && (
                <Pressable
                  onPress={() => saveRecipeToFavorites(meal.id)}
                  className="min-h-11 px-4 rounded-xl bg-slate-900 active:bg-slate-800 items-center justify-center"
                >
                  <Text className="text-sm text-white font-bold">Save</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => dislikeRecipe(meal.id)}
                className="min-h-11 px-3 rounded-xl border border-rose-100 bg-rose-50 items-center justify-center"
              >
                <Text className="text-sm text-rose-700 font-bold">Skip</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Ingredients */}
      <View className="gap-2">
        <Text className="text-base font-bold text-slate-900">
          Ingredients
        </Text>
        {(meal.ingredients || []).map((ing, idx) => {
          const inPantry = isIngredientInPantry(ing);
          const onShop = isIngredientOnShoppingList(ing);

          if (inPantry) {
            return (
              <View
                key={idx}
                className="flex-row items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100"
              >
                <Text className="text-sm font-medium text-emerald-950 flex-1">
                  {ing}
                </Text>
                <View className="px-2.5 py-1 rounded-full bg-emerald-600">
                  <Text className="text-xs text-white font-bold">Have it</Text>
                </View>
              </View>
            );
          }

          return (
            <View
              key={idx}
              className="flex-row items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-amber-50 border border-amber-100"
            >
              <Text className="text-sm font-medium text-amber-950 flex-1">
                {ing}
              </Text>
              {onShop ? (
                <View className="px-2.5 py-1 rounded-full bg-slate-200">
                  <Text className="text-xs text-slate-700 font-bold">On list</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => addMissingIngredientToShop(ing)}
                  className="min-h-9 px-3 rounded-full bg-amber-600 active:bg-amber-700 items-center justify-center"
                >
                  <Text className="text-xs text-white font-bold">+ Add</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {/* Instructions */}
      <View className="gap-2">
        <Text className="text-base font-bold text-slate-900">
          Instructions
        </Text>
        {(meal.steps || []).map((step, idx) => (
          <View key={idx} className="flex-row gap-3 py-1">
            <View className="w-7 h-7 rounded-full bg-emerald-50 items-center justify-center">
              <Text className="text-xs font-bold text-emerald-800">{idx + 1}</Text>
            </View>
            <Text className="text-sm text-slate-600 leading-5 flex-1 pt-1">
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Best Served With */}
      {(meal.serveWith || []).length > 0 && (
        <View className="pt-3 border-t border-slate-100 gap-2">
          <Text className="text-base font-bold text-slate-900">
            Goes well with
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(meal.serveWith || []).map((side, idx) => {
              const isAdded = (meal.addedSides || []).includes(side);
              if (isAdded) {
                return (
                  <View
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200"
                  >
                    <Text className="text-xs font-bold text-emerald-800">
                      {side} ✓
                    </Text>
                  </View>
                );
              }
              return (
                <Pressable
                  key={idx}
                  disabled={loadingSideIdx === idx}
                  onPress={() => handleAddSide(idx)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 active:bg-emerald-50"
                >
                  <Text className="text-xs font-semibold text-slate-700">
                    {loadingSideIdx === idx ? 'Adding...' : `+ ${side}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Recipe Notes */}
      <View className="pt-3 border-t border-slate-100 gap-2">
        <Text className="text-base font-bold text-slate-900">
          Make it your own
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={noteInput}
            onChangeText={setNoteInput}
            placeholder="Tell the generator what to change..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-3.5 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
          />
          <Pressable
            disabled={updatingNote}
            onPress={handleUpdateNote}
            className="px-4 rounded-xl bg-slate-900 justify-center"
          >
            <Text className="text-white text-sm font-bold">
              {updatingNote ? '...' : 'Update'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}