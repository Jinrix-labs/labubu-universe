import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { colors, radii, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export function CollectionEmptyState({
  title,
  subtitle,
  ctaLabel = 'Browse catalog',
  onCtaPress,
}: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <View style={styles.wrap}>
      <ThemedText variant="subtitle">{title}</ThemedText>
      <ThemedText muted style={styles.subtitle}>
        {subtitle}
      </ThemedText>
      {onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemedText
            variant="bodyStrong"
            style={{ color: theme.primaryText }}
          >
            {ctaLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    minHeight: 220,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
