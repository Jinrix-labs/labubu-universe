import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/components/useColorScheme';
import { colors, radii, spacing } from '@/theme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText
              variant="label"
              style={{
                color: selected ? theme.text : theme.textMuted,
                textAlign: 'center',
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
});
