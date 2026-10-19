import { Text, type TextProps, type TextStyle } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
};

export function ThemedText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: Props) {
  const scheme = useColorScheme();
  const theme = colors[scheme];

  return (
    <Text
      {...rest}
      style={[
        typography[variant] as TextStyle,
        { color: color ?? (muted ? theme.textMuted : theme.text) },
        style,
      ]}
    />
  );
}
