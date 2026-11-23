
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { RecipeCard } from '../components/RecipeCard';
import { usePantry } from '../context/PantryContext';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const COOKING_TYPES = ['Any', 'Airfryer', 'Stove', 'Oven', 'Convection Oven'];
const CARB_OPTIONS = [
  { label: 'Strict Keto ≤10g', value: '10g' },
  { label: 'Low-Carb ≤20g', value: '20g' },
  { label: 'Moderate ≤30g', value: '30g' },
];
const PANTRY_MODES = [
  { label: 'Prioritize Pantry', value: 'prioritize' },
  { label: 'Pantry Only', value: 'strict' },
  { label: 'Creative', value: 'creative' },
];

export default function MealsScreen() {
  const {
    recipes,
    activeModelBadge,
    isGenerating,
    elapsedSeconds,
    aiError,
    generateMeals,
    generateBaking,
    generateAiRecipe,
  } = usePantry();

  const [ideaType, setIdeaType] = useState<'meals' | 'baking' | 'ai'>('meals');
  const [mealType, setMealType] = useState('Dinner');
  const [cookingType, setCookingType] = useState('Any');
  const [maxCarbs, setMaxCarbs] = useState('20g');
  const [pantryMode, setPantryMode] = useState('prioritize');
  const [craving, setCraving] = useState('');
  const [aiRequest, setAiRequest] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const visibleRecipes = recipes.filter((recipe) =>
    ideaType === 'ai'
      ? recipe.source === 'ai'
      : recipe.source !== 'ai' && (ideaType === 'baking' ? recipe.category === 'baking' : recipe.category !== 'baking')
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-5"
      contentContainerStyle={{ gap: 20, paddingTop: 4, paddingBottom: 48 }}
    >
      <View className="gap-1">
        <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
          What sounds good?
        </Text>
        <Text className="text-sm text-slate-500">
          Get pantry-based ideas from the built-in generator, even offline.
        </Text>
      </View>

      <View className="flex-row gap-2">
        {(['meals', 'baking', 'ai'] as const).map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: ideaType === type, disabled: isGenerating }}
            disabled={isGenerating}
            onPress={() => setIdeaType(type)}
            className={`flex-1 min-h-11 rounded-2xl items-center justify-center ${
              ideaType === type ? 'bg-emerald-600' : 'bg-white border border-slate-200'
            }`}
          >
            <Text className={`font-bold ${ideaType === type ? 'text-white' : 'text-slate-700'}`}>
              {type === 'meals' ? 'Meals' : type === 'baking' ? 'Baking' : 'Ask AI'}
            </Text>
          </Pressable>
        ))}
      </View>

      {ideaType === 'ai' ? (
        <View className="bg-white p-5 rounded-3xl border border-slate-200 gap-4">
          <Text className="text-base font-bold text-slate-900">What do you want to make?</Text>
          <Text className="text-sm text-slate-500">
            Describe a meal or bake. Your request is sent to your recipe server and OpenAI.
            Review the result, especially cooking temperatures and allergens.
          </Text>
          <TextInput
            accessibilityLabel="Recipe request"
            value={aiRequest}
            onChangeText={setAiRequest}
            placeholder="e.g. I want to make a lemon cake"
            placeholderTextColor="#94a3b8"
            maxLength={500}
            multiline
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 min-h-20"
          />
          <Text className="text-sm font-semibold text-slate-700">Recipe server URL</Text>
          <TextInput
            accessibilityLabel="Recipe server URL"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://your-recipe-server"
            placeholderTextColor="#94a3b8"
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
          />
          <Text className="text-sm font-semibold text-slate-700">Server access token</Text>
          <TextInput
            accessibilityLabel="Server access token"
            value={accessToken}
            onChangeText={setAccessToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Your server access token"
            placeholderTextColor="#94a3b8"
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
          />
          <Text className="text-xs text-slate-500">
            The access token stays in this app session. Your OpenAI API key belongs only on the server.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isGenerating}
            onPress={() => generateAiRecipe(serverUrl, accessToken, aiRequest)}
            className={`py-4 rounded-2xl items-center ${isGenerating ? 'bg-emerald-600/60' : 'bg-emerald-600'}`}
          >
            <Text className="text-white font-extrabold text-base">
              {isGenerating ? 'Generating recipe...' : 'Generate Recipe'}
            </Text>
          </Pressable>
        </View>
      ) : ideaType === 'baking' ? (
        <View className="bg-white p-5 rounded-3xl border border-slate-200 gap-4">
          <Text className="text-base font-bold text-slate-900">Baking ideas</Text>
          <Text className="text-sm text-slate-500">
            Get simple baking recipes, including regular recipes that are not low-carb.
            Check the ingredients against your pantry and add missing items to your shopping list.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={generateBaking}
            className="py-4 rounded-2xl items-center bg-emerald-600"
          >
            <Text className="text-white font-extrabold text-base">Generate Baking Ideas</Text>
          </Pressable>
        </View>
      ) : (
      <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-900">
            Meal preferences
          </Text>
          <View className="px-3 py-1.5 rounded-full bg-emerald-50">
            <Text className="text-xs text-emerald-700 font-bold">
              {activeModelBadge}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            What meal?
          </Text>
          <View className="flex-row gap-2">
            {MEAL_TYPES.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMealType(m)}
                className={`flex-1 min-h-11 rounded-2xl border items-center justify-center ${
                  mealType === m
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    mealType === m ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Cooking method
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {COOKING_TYPES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCookingType(c)}
                className={`min-h-10 px-3.5 rounded-xl border justify-center ${
                  cookingType === c
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    cookingType === c ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {c === 'Any' ? 'Any Appliance' : c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Carb limit per serving
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CARB_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setMaxCarbs(opt.value)}
                className={`min-h-10 px-3.5 rounded-xl border justify-center ${
                  maxCarbs === opt.value
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    maxCarbs === opt.value ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">
            Use your pantry
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PANTRY_MODES.map((mode) => (
              <Pressable
                key={mode.value}
                onPress={() => setPantryMode(mode.value)}
                className={`min-h-10 px-3.5 rounded-xl border justify-center ${
                  pantryMode === mode.value
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    pantryMode === mode.value ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextInput
          value={craving}
          onChangeText={setCraving}
          placeholder="Focus ingredient or craving (e.g., chicken, spicy)..."
          placeholderTextColor="#94a3b8"
          className="px-4 py-3.5 text-sm rounded-2xl border border-slate-200 bg-slate-50 text-slate-900"
        />

        <Pressable
          disabled={isGenerating}
          onPress={() =>
            generateMeals({ mealType, cookingType, maxCarbs, pantryMode, craving })
          }
          className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm ${
            isGenerating ? 'bg-emerald-600/60' : 'bg-emerald-600 active:bg-emerald-700'
          }`}
        >
          <Text className="text-base">✨</Text>
          <Text className="text-white font-extrabold text-base">
            {isGenerating ? `Generating... ${elapsedSeconds}s` : 'Generate 3 Meals'}
          </Text>
        </Pressable>
      </View>
      )}

      {aiError && (
        <View className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <Text className="text-sm font-medium text-rose-800">{aiError}</Text>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-extrabold text-slate-900">Your recipes</Text>
        {visibleRecipes.length > 0 && (
          <Text className="text-sm font-medium text-slate-500">
            {visibleRecipes.length} {visibleRecipes.length === 1 ? 'recipe' : 'recipes'}
          </Text>
        )}
      </View>

      {visibleRecipes.length === 0 ? (
        <View className="bg-white rounded-3xl border border-slate-200 p-8 items-center gap-2">
          <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center mb-1">
            <Text className="text-2xl">🍽️</Text>
          </View>
          <Text className="text-base font-bold text-slate-900">
            Your next favorite starts here
          </Text>
          <Text className="text-sm text-slate-500 text-center leading-5">
            {ideaType === 'ai'
              ? 'Describe a dish to generate a recipe.'
              : ideaType === 'baking'
              ? 'Generate baking ideas to see recipes here.'
              : 'Choose a few preferences, then we’ll suggest meals you can make.'}
          </Text>
        </View>
      ) : (
        visibleRecipes.map((meal) => <RecipeCard key={meal.id} meal={meal} isSavedTab={false} />)
      )}
    </ScrollView>
  );
}