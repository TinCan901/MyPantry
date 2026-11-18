import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { usePantry } from '../context/PantryContext';

export function SettingsModal() {
  const {
    settingsVisible,
    setSettingsVisible,
    exportData,
    importData,
  } = usePantry();

  return (
    <Modal
      visible={settingsVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setSettingsVisible(false)}
    >
      <View className="flex-1 bg-slate-950/60 justify-end">
        <View className="bg-white rounded-t-3xl p-6 gap-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-extrabold text-slate-900">
              Settings &amp; Backup
            </Text>
            <Pressable
              onPress={() => setSettingsVisible(false)}
              className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
            >
              <Text className="text-xl font-bold text-slate-700">×</Text>
            </Pressable>
          </View>

          <View className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 gap-1">
            <Text className="text-sm font-bold text-emerald-900">
              Built-in recipe generator
            </Text>
            <Text className="text-xs leading-relaxed text-emerald-800">
              Suggestions are created on this device from your pantry and preferences. No account,
              API key, or internet connection is needed.
            </Text>
          </View>

          <View className="border-t border-slate-100 pt-4 gap-2.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pantry &amp; Recipe Backups
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={exportData}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex-row items-center justify-center gap-2"
              >
                <Text className="text-lg text-slate-900">↗</Text>
                <Text className="text-sm font-bold text-slate-800">Export JSON</Text>
              </Pressable>
              <Pressable
                onPress={importData}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex-row items-center justify-center gap-2"
              >
                <Text className="text-lg text-slate-900">↓</Text>
                <Text className="text-sm font-bold text-slate-800">Import JSON</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}