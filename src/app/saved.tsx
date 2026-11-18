import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { usePantry } from '../context/PantryContext';
import { RecipeCard } from '../components/RecipeCard';

export default function SavedScreen() {
  const { savedRecipes, dislikedRecipes, unbanDislikedRecipe } = usePantry();

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-5"
      contentContainerStyle={{ gap: 20, paddingTop: 4, paddingBottom: 48 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
          Saved recipes
        </Text>
        <Text className="text-sm text-slate-500">
          Keep the meals you’d love to make again.
        </Text>
      </View>

      {dislikedRecipes.length > 0 && (
        <View className="bg-white p-4 rounded-3xl border border-slate-200 gap-3">
          <View className="gap-1">
            <Text className="text-base font-bold text-slate-900">Not your thing?</Text>
            <Text className="text-sm text-slate-500">
              Remove a meal here if you’d like to see it again.
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {dislikedRecipes.map((recipe, idx) => (
              <View
                key={`${recipe.title}_${idx}`}
                className="flex-row items-center gap-2 px-3 py-2 rounded-2xl bg-rose-50 border border-rose-100"
              >
                <Text className="text-sm font-medium text-rose-800">
                  {recipe.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Allow ${recipe.title} in meal suggestions again`}
                  onPress={() => unbanDislikedRecipe(idx)}
                  className="w-7 h-7 rounded-full bg-white items-center justify-center"
                >
                  <Text className="text-base font-bold text-rose-600">×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {savedRecipes.length === 0 ? (
        <View className="bg-white rounded-3xl border border-slate-200 p-8 items-center gap-2">
          <View className="w-14 h-14 rounded-2xl bg-rose-50 items-center justify-center mb-1">
            <Text className="text-2xl">♥</Text>
          </View>
          <Text className="text-base font-bold text-slate-900">
            Your favorites will live here
          </Text>
          <Text className="text-sm text-slate-500 text-center leading-5">
            Save a recipe you love and it’ll be easy to find next time.
          </Text>
        </View>
      ) : (
        savedRecipes.map((meal) => (
          <RecipeCard key={meal.id} meal={meal} isSavedTab={true} />
        ))
      )}
    </ScrollView>
  );
}