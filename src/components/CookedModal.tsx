import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { usePantry } from '../context/PantryContext';
import { CookedDeductionMatch, PantryItem, Recipe } from '../types/pantry';
import { calculateDeductedQty, findMatchingPantryItem } from '../utils/pantryMath';

type DeductionRow = CookedDeductionMatch & {
  currentQty: string;
  checkedOut: boolean;
};

function getDeductionRows(meal: Recipe, pantry: PantryItem[]): DeductionRow[] {
  const seen = new Set<string>();
  const rows: DeductionRow[] = [];

  (meal.ingredients || []).forEach((ingredient) => {
    const item = findMatchingPantryItem(pantry, ingredient);
    if (!item || seen.has(item.id)) return;

    seen.add(item.id);
    const suggestedQty = calculateDeductedQty(item.qty, ingredient);
    const isZero = /^0(\.0+)?\s*[a-z]*$/i.test(suggestedQty);
    rows.push({
      pantryId: item.id,
      pantryName: item.name,
      oldQty: item.qty,
      ingredientUsed: ingredient,
      suggestedQty,
      isZero,
      currentQty: suggestedQty,
      checkedOut: isZero,
    });
  });

  return rows;
}

export function CookedModal() {
  const { cookedTarget, closeCookedModal, recipes, savedRecipes, pantry, applyCookedDeductions } =
    usePantry();

  if (!cookedTarget) return null;

  const list = cookedTarget.isSavedTab ? savedRecipes : recipes;
  const meal = list.find((item) => item.id === cookedTarget.mealId);
  if (!meal) return null;

  return (
    <CookedModalSession
      key={`${cookedTarget.isSavedTab ? 'saved' : 'generated'}:${cookedTarget.mealId}`}
      meal={meal}
      pantry={pantry}
      closeCookedModal={closeCookedModal}
      applyCookedDeductions={applyCookedDeductions}
    />
  );
}

function CookedModalSession({
  meal,
  pantry,
  closeCookedModal,
  applyCookedDeductions,
}: {
  meal: Recipe;
  pantry: PantryItem[];
  closeCookedModal: () => void;
  applyCookedDeductions: (
    updates: { pantryId: string; newQty: string; isOut: boolean }[]
  ) => void;
}) {
  const [rows, setRows] = useState(() => getDeductionRows(meal, pantry));

  const handleConfirm = () => {
    applyCookedDeductions(
      rows.map((r) => ({
        pantryId: r.pantryId,
        newQty: r.currentQty,
        isOut: r.checkedOut,
      }))
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={closeCookedModal}
    >
      <View className="flex-1 bg-slate-900/50 items-center justify-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-xl gap-4">
          <View className="flex-row justify-between items-center border-b border-slate-100 pb-3">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-slate-900">
                Deduct Cooked Ingredients
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">Meal: {meal.title}</Text>
            </View>
            <Pressable onPress={closeCookedModal}>
              <Text className="text-slate-400 text-2xl font-bold">×</Text>
            </Pressable>
          </View>

          <ScrollView className="max-h-80" contentContainerStyle={{ gap: 10 }}>
            {rows.map((row, idx) => (
              <View
                key={row.pantryId}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 gap-2"
              >
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      {row.pantryName}
                    </Text>
                    <Text className="text-[11px] text-slate-500">
                      Recipe uses: {row.ingredientUsed}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-500">
                    Was: <Text className="font-bold text-slate-800">{row.oldQty}</Text>
                  </Text>
                </View>

                <View className="flex-row flex-wrap items-center justify-between gap-2 pt-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-slate-700">New Qty:</Text>
                    <TextInput
                      value={row.currentQty}
                      onChangeText={(val) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, currentQty: val } : r))
                        )
                      }
                      className="w-28 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                    />
                  </View>

                  <Pressable
                    onPress={() =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, checkedOut: !r.checkedOut } : r
                        )
                      )
                    }
                    className="flex-row items-center gap-1.5"
                  >
                    <View
                      className={`w-4 h-4 rounded border items-center justify-center ${
                        row.checkedOut
                          ? 'bg-amber-600 border-amber-600'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {row.checkedOut && (
                        <Text className="text-white text-[10px] font-bold">✓</Text>
                      )}
                    </View>
                    <Text className="text-xs text-amber-800 font-medium">
                      Out of stock → Shop
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className="flex-row justify-end gap-2 pt-2 border-t border-slate-100">
            <Pressable
              onPress={closeCookedModal}
              className="px-4 py-2 rounded-xl border border-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="px-4 py-2 rounded-xl bg-emerald-600 active:bg-emerald-700"
            >
              <Text className="text-xs font-semibold text-white">
                Confirm &amp; Update Pantry
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}