import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { usePantry } from '../context/PantryContext';

export default function ShoppingScreen() {
  const {
    shoppingList,
    addManualShoppingItem,
    toggleShoppingItem,
    restockChecked,
    clearCheckedShopping,
  } = usePantry();

  const [itemInput, setItemInput] = useState('');
  const checkedCount = shoppingList.filter((item) => item.checked).length;

  const handleAdd = () => {
    if (!itemInput.trim()) return;
    addManualShoppingItem(itemInput);
    setItemInput('');
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-5"
      contentContainerStyle={{ gap: 20, paddingTop: 4, paddingBottom: 48 }}
    >
      <View className="flex-row items-end justify-between">
        <View className="flex-1 gap-1 pr-3">
          <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
            Shopping list
          </Text>
          <Text className="text-sm text-slate-500">
            A little list for your next shop.
          </Text>
        </View>
        <View className="px-3 py-2 rounded-2xl bg-emerald-50">
          <Text className="text-sm font-bold text-emerald-800">
            {shoppingList.length - checkedCount}{' '}
            {shoppingList.length - checkedCount === 1 ? 'item' : 'items'} left
          </Text>
        </View>
      </View>

      <View className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm gap-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={itemInput}
            onChangeText={setItemInput}
            placeholder="Add grocery item..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 text-slate-900"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add item to shopping list"
            onPress={handleAdd}
            className="min-h-12 px-4 bg-emerald-700 active:bg-emerald-800 rounded-2xl justify-center"
          >
            <Text className="text-white text-sm font-bold">Add</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            disabled={checkedCount === 0}
            onPress={restockChecked}
            className={`flex-1 min-h-11 rounded-2xl items-center justify-center ${
              checkedCount > 0 ? 'bg-emerald-50' : 'bg-slate-50'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                checkedCount > 0 ? 'text-emerald-800' : 'text-slate-400'
              }`}
            >
              Restock {checkedCount > 0 ? `(${checkedCount})` : 'checked'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={checkedCount === 0}
            onPress={clearCheckedShopping}
            className="min-h-11 px-4 border border-slate-200 bg-slate-50 rounded-2xl items-center justify-center"
          >
            <Text
              className={`text-sm font-semibold ${
                checkedCount > 0 ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Clear
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-900">Items to get</Text>
          {checkedCount > 0 && (
            <Text className="text-sm text-slate-500">{checkedCount} picked up</Text>
          )}
        </View>

        <View className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {shoppingList.length === 0 ? (
            <View className="p-8 items-center gap-2">
              <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center mb-1">
                <Text className="text-2xl">🛍️</Text>
              </View>
              <Text className="text-base font-bold text-slate-900">
                All stocked up?
              </Text>
              <Text className="text-sm text-slate-500 text-center">
                Add something you need and it’ll show up here.
              </Text>
            </View>
          ) : (
            shoppingList.map((item, idx) => (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.checked }}
                onPress={() => toggleShoppingItem(item.id)}
                className={`flex-row items-center justify-between gap-3 px-4 py-4 ${
                  idx > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <View className="flex-row items-center gap-3.5 flex-1">
                  <View
                    className={`w-7 h-7 rounded-xl border-2 items-center justify-center ${
                      item.checked
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.checked && (
                      <Text className="text-xs font-extrabold text-white">✓</Text>
                    )}
                  </View>
                  <Text
                    className={`text-base font-medium flex-1 ${
                      item.checked ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </Text>
                </View>

                <View className="px-2.5 py-1 rounded-full bg-slate-100">
                  <Text className="text-xs font-medium text-slate-500">
                    {item.source}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}