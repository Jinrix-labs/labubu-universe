import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function Index() {
  const { session, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = colors[scheme];

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/catalog" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
