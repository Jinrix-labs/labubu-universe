import { Stack } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { colors } from '@/theme';

export default function AuthLayout() {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
