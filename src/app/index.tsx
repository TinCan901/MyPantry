import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CONTAINER_OPTIONS,
  PANTRY_CATEGORIES,
  UNIT_OPTIONS,
} from '../constants/pantryDefaults';
import { usePantry } from '../context/PantryContext';
import { ContainerType, PantryCategory, PantryItem, UnitType } from '../types/pantry';
import { splitQtyParts } from '../utils/pantryMath';

const ICON_GLYPHS = {
  flame: '🔥',
  leaf: '🍃',
  egg: '🥚',
  water: '💧',
  sparkles: '✦',
  search: '⌕',
  'close-circle': '⊗',
  restaurant: '🍽',
  'basket-outline': '🧺',
  pencil: '✎',
  cart: '🛒',
  add: '+',
  close: '×',
} as const;

type IconName = keyof typeof ICON_GLYPHS;

const Ionicons = ({
  name,
  size,
  color,
}: {
  name: IconName;
  size: number;
  color: string;
}) => <Text style={{ fontSize: size, color }}>{ICON_GLYPHS[name]}</Text>;

const CATEGORY_META: Record<
  PantryCategory,
  { icon: IconName; bg: string; color: string; short: string }
> = {
  Protein: { icon: 'flame', bg: 'bg-rose-50', color: '#e11d48', short: 'Protein' },
  'Low-Carb Veggies': {
    icon: 'leaf',
    bg: 'bg-emerald-50',
    color: '#059669',
    short: 'Veggies',
  },
  'Dairy & Eggs': {
    icon: 'egg',
    bg: 'bg-amber-50',
    color: '#d97706',
    short: 'Dairy & Eggs',
  },
  'Fats & Oils': {
    icon: 'water',
    bg: 'bg-yellow-50',
    color: '#ca8a04',
    short: 'Fats & Oils',
  },
  'Pantry & Spices': {
    icon: 'sparkles',
    bg: 'bg-purple-50',
    color: '#7c3aed',
    short: 'Spices',
  },
};

export default function PantryScreen() {
  const { pantry, addPantryItem, updatePantryItem, markItemFinished } = usePantry();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Add / Edit Modal state
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory>('Protein');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<UnitType>('g');
  const [container, setContainer] = useState<ContainerType>('Pack');
  const [count, setCount] = useState('1');

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Protein');
    setAmount('');
    setUnit('g');
    setContainer('Pack');
    setCount('1');
    setFormVisible(true);
  };

  const openEditModal = (item: PantryItem) => {
    const parts = splitQtyParts(item.qty);
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setAmount(parts.amount);
    setUnit(parts.unit);
    setContainer(parts.container);
    setCount(String(parts.count));
    setFormVisible(true);
  };

  const handleSaveFood = () => {
    if (!name.trim()) return;
    if (editingItem) {
      updatePantryItem(editingItem.id, {
        name,
        category,
        amount,
        unit,
        container,
        count,
      });
    } else {
      addPantryItem({ name, category, amount, unit, container, count });
    }
    setFormVisible(false);
  };

  const filtered = pantry.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchText = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ gap: 20, paddingTop: 4, paddingBottom: 48 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
            Your pantry
          </Text>
          <Text className="text-sm text-slate-500">
            Everything you have, ready to cook.
          </Text>
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-1 shadow-sm">
          <Ionicons name="search" size={19} color="#059669" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your pantry..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-sm text-slate-900 font-medium"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={19} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore meal ideas"
          onPress={() => router.push('/meals')}
          className="bg-emerald-800 rounded-3xl p-5 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-1 pr-4 gap-1.5">
            <Text className="text-xs font-bold tracking-wider text-emerald-200">
              A LITTLE INSPIRATION
            </Text>
            <Text className="text-xl font-extrabold text-white leading-tight">
              Make something good
            </Text>
            <Text className="text-sm text-emerald-100">
              Find a meal using what you have.
            </Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-white/15 items-center justify-center">
            <Ionicons name="restaurant" size={25} color="#ffffff" />
          </View>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">Browse by category</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {['All', ...PANTRY_CATEGORIES].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-4 py-2.5 rounded-full border ${
                      active
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        active ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {cat === 'All'
                        ? 'All'
                        : CATEGORY_META[cat as PantryCategory].short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-slate-900">
              {selectedCategory === 'All' ? 'In your pantry' : selectedCategory}
            </Text>
            <Text className="text-xs font-medium text-slate-500 mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openAddModal}
            className="min-h-11 px-4 rounded-2xl bg-emerald-700 flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-sm font-bold text-white">Add food</Text>
          </Pressable>
        </View>

        {filtered.length === 0 ? (
          <View className="bg-white rounded-3xl border border-slate-200 p-8 items-center gap-2">
            <View className="w-14 h-14 rounded-2xl bg-emerald-50 items-center justify-center mb-1">
              <Ionicons name="basket-outline" size={28} color="#059669" />
            </View>
            <Text className="text-base font-bold text-slate-900">
              {pantry.length === 0 ? 'Your pantry is ready' : 'No items found'}
            </Text>
            <Text className="text-sm text-slate-500 text-center leading-5">
              {pantry.length === 0
                ? 'Add a few ingredients and we’ll help you plan what to cook.'
                : 'Try another search or choose a different category.'}
            </Text>
            {pantry.length === 0 && (
              <Pressable
                onPress={openAddModal}
                className="mt-2 px-5 py-3 rounded-2xl bg-emerald-700"
              >
                <Text className="text-sm font-bold text-white">Add your first item</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map((item) => {
            const meta =
              CATEGORY_META[item.category] || CATEGORY_META['Pantry & Spices'];
            return (
              <View
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 gap-3 shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-12 h-12 rounded-2xl ${meta.bg} items-center justify-center`}
                  >
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      className="text-base font-bold text-slate-900 leading-5"
                    >
                      {item.name}
                    </Text>
                    <Text className="text-sm text-slate-500 mt-1">
                      {item.qty} <Text className="text-slate-300">·</Text> {meta.short}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    onPress={() => openEditModal(item)}
                    className="w-11 h-11 rounded-2xl bg-slate-50 items-center justify-center"
                  >
                    <Ionicons name="pencil" size={17} color="#475569" />
                  </Pressable>
                </View>

                <View className="border-t border-slate-100 pt-3 flex-row justify-end">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${item.name} to shopping list`}
                    onPress={() => markItemFinished(item.id)}
                    className="min-h-11 px-4 rounded-xl bg-amber-50 flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="cart" size={15} color="#b45309" />
                    <Text className="text-sm font-semibold text-amber-800">
                      Used up
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Spacious Bottom Sheet Modal for Adding / Editing Food */}
      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View className="flex-1 bg-slate-950/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 gap-4 max-h-[90%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-slate-900">
                {editingItem ? 'Edit Pantry Item' : 'Add to Pantry'}
              </Text>
              <Pressable
                onPress={() => setFormVisible(false)}
                className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#334155" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Food Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Chicken Breasts, Mince..."
                  placeholderTextColor="#94a3b8"
                  className="px-4 py-3.5 text-base rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PANTRY_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`px-3.5 py-2.5 rounded-2xl border ${
                        category === cat
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          category === cat ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1.5">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Size / Weight
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="500"
                    placeholderTextColor="#94a3b8"
                    className="px-4 py-3.5 text-base rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold"
                  />
                </View>

                <View className="w-28 gap-1.5">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Packs / Count
                  </Text>
                  <TextInput
                    value={count}
                    onChangeText={setCount}
                    keyboardType="numeric"
                    className="px-4 py-3.5 text-base text-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold"
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Unit
                </Text>
                <View className="flex-row gap-2">
                  {UNIT_OPTIONS.map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => setUnit(u)}
                      className={`flex-1 py-3 rounded-2xl border items-center ${
                        unit === u
                          ? 'bg-slate-900 border-slate-900'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          unit === u ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {u}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Container Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CONTAINER_OPTIONS.map((c) => (
                    <Pressable
                      key={c || 'none'}
                      onPress={() => setContainer(c)}
                      className={`px-3.5 py-2.5 rounded-2xl border ${
                        container === c
                          ? 'bg-emerald-50 border-emerald-500'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          container === c ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {c || 'Loose / None'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSaveFood}
              className="w-full py-4 rounded-2xl bg-emerald-600 active:bg-emerald-700 items-center shadow-sm"
            >
              <Text className="text-white text-base font-extrabold">
                {editingItem ? 'Save Changes' : '+ Add to My Pantry'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}