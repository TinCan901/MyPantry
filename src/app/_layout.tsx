import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { CookedModal } from '../components/CookedModal';
import { SettingsModal } from '../components/SettingsModal';
import { PantryProvider, usePantry } from '../context/PantryContext';
import '../global.css';

function AppShell() {
  const { toast, undoLastFinish } = usePantry();

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e2e8f0',
            height: 68,
            paddingBottom: 10,
            paddingTop: 8,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Pantry',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size, lineHeight: size }}>🥬</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="meals"
          options={{
            title: 'Meals',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size, lineHeight: size }}>✨</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size, lineHeight: size }}>♥</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size, lineHeight: size }}>🛒</Text>
            ),
          }}
        />
      </Tabs>

      <SettingsModal />
      <CookedModal />

      {toast && (
        <View className="absolute bottom-24 left-5 right-5 bg-slate-900 px-4 py-3.5 rounded-2xl flex-row items-center justify-between shadow-xl">
          <Text className="text-white text-sm font-medium flex-1 pr-3">
            {toast.message}
          </Text>
          {toast.canUndo && (
            <Pressable
              onPress={undoLastFinish}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20"
            >
              <Text className="text-emerald-400 font-extrabold text-sm">Undo</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <PantryProvider>
      <AppShell />
    </PantryProvider>
  );
}