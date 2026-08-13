import type React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/shared/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabIconProps = { icon: IconName; label: string; focused: boolean };

function TabIcon({ icon, label, focused }: TabIconProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tabItem}>
      <Ionicons name={icon} size={focused ? 36 : 33} color={theme.colors.accent} />
      <Text style={styles.tabLabel}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar, tabBarItemStyle: styles.tabBarItem }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home-outline" label={t('tabs.home')} focused={focused} /> }} />
      <Tabs.Screen name="monitoring" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="eye-outline" label={t('tabs.monitoring')} focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="time-outline" label={t('tabs.history')} focused={focused} /> }} />
      <Tabs.Screen name="history-filters" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="settings-outline" label={t('tabs.settings')} focused={focused} /> }} />
    </Tabs>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  tabBar: { height: 72, backgroundColor: theme.colors.header, borderTopWidth: 0, paddingTop: 6, paddingBottom: 6 },
  tabBarItem: { height: 60 },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  tabLabel: { color: theme.colors.accent, fontSize: 9, fontWeight: '900' },
  });
}
