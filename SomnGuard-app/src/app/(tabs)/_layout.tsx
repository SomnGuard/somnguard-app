import type React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabIconProps = { icon: IconName; activeIcon: IconName; label: string; focused: boolean };

function TabIcon({ icon, activeIcon, label, focused }: TabIconProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const color = focused ? theme.colors.tabIconSelected : theme.colors.text;

  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIndicator, focused && styles.tabIndicatorActive]} />
      <Ionicons name={focused ? activeIcon : icon} size={focused ? 28 : 26} color={color} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarHideOnKeyboard: true, tabBarStyle: styles.tabBar, tabBarItemStyle: styles.tabBarItem }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home-outline" activeIcon="home" label={t('tabs.home')} focused={focused} /> }} />
      <Tabs.Screen name="monitoring" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="eye-outline" activeIcon="eye" label={t('tabs.monitoring')} focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="time-outline" activeIcon="time" label={t('tabs.history')} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="settings-outline" activeIcon="settings" label={t('tabs.settings')} focused={focused} /> }} />
    </Tabs>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme'], bottomInset: number = 0) {
  return StyleSheet.create({
  tabBar: {
    height: 80 + bottomInset,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingBottom: Math.max(bottomInset, 12),
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  tabBarItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 0 },
  tabItem: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  tabIndicator: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginBottom: 4 },
  tabIndicatorActive: { backgroundColor: theme.colors.tabIconSelected },
  tabLabel: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 21 },
  tabLabelFocused: { color: theme.colors.tabIconSelected, fontWeight: '800' },
  });
}
