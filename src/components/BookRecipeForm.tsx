import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { usePantry } from '../context/PantryContext';

export function BookRecipeForm({ onClose }: { onClose: () => void }) {
  const { addBookRecipe } = usePantry();
  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [category, setCategory] = useState<'meal' | 'baking'>('meal');
  const [error, setError] = useState('');

  const save = () => {
    const ingredientLines = ingredients.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const stepLines = steps.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const servingCount = Number(servings);
    if (!title.trim() || ingredientLines.length === 0 || stepLines.length === 0) {
      setError('Enter a title, at least one ingredient, and at least one instruction.');
      return;
    }
    if (!/^\d+$/.test(servings.trim()) || !Number.isSafeInteger(servingCount) || servingCount < 1) {
      setError('Enter a whole number of servings greater than zero.');
      return;
    }
    addBookRecipe({
      title: title.trim(),
      prepTime: prepTime.trim(),
      servings: servingCount,
      category,
      ingredients: ingredientLines,
      steps: stepLines,
    });
    onClose();
  };

  const inputStyle = 'px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900';

  return (
    <View className="bg-white p-5 rounded-3xl border border-slate-200 gap-3">
      <Text className="text-lg font-bold text-slate-900">Add a cookbook recipe</Text>
      <Text className="text-sm text-slate-500">Enter one ingredient or instruction per line.</Text>
      <Text className="font-semibold text-slate-700">Recipe type</Text>
      <View className="flex-row gap-2">
        {(['meal', 'baking'] as const).map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: category === type }}
            onPress={() => setCategory(type)}
            className={`px-4 py-3 rounded-xl ${category === type ? 'bg-emerald-600' : 'bg-slate-100'}`}
          >
            <Text className={category === type ? 'text-white font-bold' : 'text-slate-700 font-bold'}>
              {type === 'meal' ? 'Meal' : 'Baking'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-semibold text-slate-700">Title *</Text>
      <TextInput accessibilityLabel="Recipe title" value={title} onChangeText={setTitle} placeholder="Recipe title" className={inputStyle} />
      <Text className="font-semibold text-slate-700">Time (optional)</Text>
      <TextInput accessibilityLabel="Recipe time" value={prepTime} onChangeText={setPrepTime} placeholder="e.g. 45 mins" className={inputStyle} />
      <Text className="font-semibold text-slate-700">Servings *</Text>
      <TextInput accessibilityLabel="Servings" value={servings} onChangeText={setServings} keyboardType="number-pad" className={inputStyle} />
      <Text className="font-semibold text-slate-700">Ingredients *</Text>
      <TextInput accessibilityLabel="Ingredients, one per line" value={ingredients} onChangeText={setIngredients} multiline textAlignVertical="top" placeholder={'200g flour\n2 eggs'} className={`${inputStyle} min-h-28`} />
      <Text className="font-semibold text-slate-700">Instructions *</Text>
      <TextInput accessibilityLabel="Instructions, one step per line" value={steps} onChangeText={setSteps} multiline textAlignVertical="top" placeholder={'Mix the ingredients.\nBake until golden.'} className={`${inputStyle} min-h-28`} />
      {!!error && <Text accessibilityRole="alert" className="text-sm text-rose-700">{error}</Text>}
      <View className="flex-row gap-2">
        <Pressable accessibilityRole="button" onPress={save} className="flex-1 py-3 rounded-xl bg-emerald-600 items-center">
          <Text className="text-white font-bold">Save recipe</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} className="px-5 py-3 rounded-xl bg-slate-100 items-center">
          <Text className="text-slate-700 font-bold">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
