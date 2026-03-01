export interface HSLColor {
  h: number  // Hue (0-360)
  s: number  // Saturation (0-100)
  l: number  // Lightness (0-100)
}

export interface ColorPalette {
  // Core colors
  background: HSLColor
  foreground: HSLColor
  card: HSLColor
  cardForeground: HSLColor
  popover: HSLColor
  popoverForeground: HSLColor
  primary: HSLColor
  primaryForeground: HSLColor
  secondary: HSLColor
  secondaryForeground: HSLColor
  muted: HSLColor
  mutedForeground: HSLColor
  accent: HSLColor
  accentForeground: HSLColor
  destructive: HSLColor
  destructiveForeground: HSLColor
  border: HSLColor
  input: HSLColor
  ring: HSLColor

  // Semantic colors
  colorPrefer: HSLColor
  colorPreferLight: HSLColor
  colorPreferDark: HSLColor
  colorDefer: HSLColor
  colorDeferLight: HSLColor
  colorSuccess: HSLColor
  colorSuccessLight: HSLColor
  colorWarning: HSLColor
  colorError: HSLColor
  colorInfo: HSLColor
  colorHighlight: HSLColor

  // Glass morphism
  glassBg: string  // RGBA string
  glassBorder: string  // RGBA string
  glassCard: string  // RGBA string

  // Focus mode gradients
  focusGradientFrom: HSLColor
  focusGradientTo: HSLColor
  focusPreferFrom: HSLColor
  focusPreferTo: HSLColor

  // Chart colors
  chart1: HSLColor
  chart2: HSLColor
  chart3: HSLColor
  chart4: HSLColor
  chart5: HSLColor
}

export interface Theme {
  id: string
  name: string
  description: string
  isBuiltIn: boolean
  userId?: string
  colors: {
    light: ColorPalette
    dark: ColorPalette
  }
}

export interface ThemeContextValue {
  activeTheme: Theme | null
  activeThemeId: string
  setActiveTheme: (themeId: string) => void
  mode: 'light' | 'dark' | 'system'
  availableThemes: Theme[]
}