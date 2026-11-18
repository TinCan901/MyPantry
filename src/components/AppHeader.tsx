import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantry } from '../context/PantryContext';

export function AppHeader() {
  const { setSettingsVisible, shoppingList } = usePantry();
  const router = useRouter();
  const uncheckedCount = shoppingList.filter((i) => !i.checked).length;

  return (
    <SafeAreaView edges={['top']} className="bg-slate-50 px-5 pt-2 pb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-2xl bg-emerald-700 items-center justify-center shadow-sm">
            <Text className="text-xl text-white">✦</Text>
          </View>
          <View className="gap-0.5">
            <Text className="text-lg font-extrabold text-slate-900 tracking-tight">
              PantryPrep
            </Text>
            <Text className="text-xs font-medium text-slate-500">
              Your kitchen, in one place
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Shopping list, ${uncheckedCount} items to get`}
            onPress={() => router.push('/shopping')}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 items-center justify-center relative"
          >
            <Text className="text-lg">🛒</Text>
            {uncheckedCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-emerald-600 items-center justify-center">
                <Text className="text-[10px] font-extrabold text-white">
                  {uncheckedCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => setSettingsVisible(true)}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 items-center justify-center relative"
          >
            <Text className="text-xl text-slate-900">⚙</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}