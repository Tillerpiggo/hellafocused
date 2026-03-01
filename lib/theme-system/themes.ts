import { Theme } from './types'

export const builtInThemes: Theme[] = [
  {
    id: 'pink-zen',
    name: 'Pink Zen',
    description: 'A calming pink theme for gentle focus',
    isBuiltIn: true,
    colors: {
      light: {
        // Core colors - Light mode
        background: { h: 345, s: 25, l: 97 },
        foreground: { h: 345, s: 12, l: 18 },
        card: { h: 345, s: 35, l: 96 },
        cardForeground: { h: 345, s: 15, l: 22 },
        popover: { h: 345, s: 35, l: 96 },
        popoverForeground: { h: 345, s: 15, l: 22 },
        primary: { h: 345, s: 45, l: 52 },
        primaryForeground: { h: 345, s: 100, l: 98 },
        secondary: { h: 345, s: 18, l: 93 },
        secondaryForeground: { h: 345, s: 15, l: 27 },
        muted: { h: 345, s: 12, l: 91 },
        mutedForeground: { h: 345, s: 8, l: 48 },
        accent: { h: 345, s: 22, l: 89 },
        accentForeground: { h: 345, s: 18, l: 32 },
        destructive: { h: 0, s: 84.2, l: 60.2 },
        destructiveForeground: { h: 210, s: 40, l: 98 },
        border: { h: 345, s: 15, l: 87 },
        input: { h: 345, s: 15, l: 87 },
        ring: { h: 345, s: 45, l: 52 },

        // Semantic colors
        colorPrefer: { h: 38, s: 92, l: 50 },
        colorPreferLight: { h: 48, s: 96, l: 89 },
        colorPreferDark: { h: 32, s: 95, l: 44 },
        colorDefer: { h: 215, s: 14, l: 34 },
        colorDeferLight: { h: 210, s: 40, l: 96 },
        colorSuccess: { h: 142, s: 76, l: 36 },
        colorSuccessLight: { h: 138, s: 76, l: 97 },
        colorWarning: { h: 25, s: 95, l: 53 },
        colorError: { h: 0, s: 84, l: 60 },
        colorInfo: { h: 217, s: 91, l: 60 },
        colorHighlight: { h: 50, s: 98, l: 64 },

        // Glass morphism
        glassBg: 'rgba(255, 245, 248, 0.22)',
        glassBorder: 'rgba(255, 182, 193, 0.25)',
        glassCard: 'rgba(255, 255, 255, 0.92)',

        // Focus mode gradients
        focusGradientFrom: { h: 345, s: 45, l: 52 },
        focusGradientTo: { h: 340, s: 60, l: 65 },
        focusPreferFrom: { h: 38, s: 92, l: 50 },
        focusPreferTo: { h: 345, s: 45, l: 52 },

        // Chart colors
        chart1: { h: 340, s: 76, l: 61 },
        chart2: { h: 350, s: 66, l: 71 },
        chart3: { h: 330, s: 56, l: 78 },
        chart4: { h: 38, s: 92, l: 50 },
        chart5: { h: 280, s: 50, l: 65 },
      },
      dark: {
        // Core colors - Dark mode
        background: { h: 300, s: 5, l: 8 },
        foreground: { h: 330, s: 8, l: 93 },
        card: { h: 320, s: 6, l: 11 },
        cardForeground: { h: 330, s: 8, l: 90 },
        popover: { h: 320, s: 6, l: 11 },
        popoverForeground: { h: 330, s: 8, l: 90 },
        primary: { h: 340, s: 60, l: 65 },
        primaryForeground: { h: 340, s: 20, l: 6 },
        secondary: { h: 320, s: 6, l: 15 },
        secondaryForeground: { h: 330, s: 8, l: 85 },
        muted: { h: 310, s: 5, l: 14 },
        mutedForeground: { h: 320, s: 5, l: 55 },
        accent: { h: 325, s: 8, l: 17 },
        accentForeground: { h: 330, s: 8, l: 88 },
        destructive: { h: 0, s: 72, l: 51 },
        destructiveForeground: { h: 0, s: 0, l: 98 },
        border: { h: 320, s: 6, l: 17 },
        input: { h: 320, s: 6, l: 17 },
        ring: { h: 340, s: 60, l: 65 },

        // Semantic colors
        colorPrefer: { h: 38, s: 92, l: 50 },
        colorPreferLight: { h: 48, s: 96, l: 89 },
        colorPreferDark: { h: 32, s: 95, l: 44 },
        colorDefer: { h: 215, s: 20, l: 25 },
        colorDeferLight: { h: 210, s: 15, l: 20 },
        colorSuccess: { h: 142, s: 76, l: 36 },
        colorSuccessLight: { h: 138, s: 30, l: 20 },
        colorWarning: { h: 25, s: 95, l: 53 },
        colorError: { h: 0, s: 84, l: 60 },
        colorInfo: { h: 217, s: 91, l: 60 },
        colorHighlight: { h: 50, s: 98, l: 45 },

        // Glass morphism
        glassBg: 'rgba(40, 20, 30, 0.18)',
        glassBorder: 'rgba(200, 120, 160, 0.12)',
        glassCard: 'rgba(0, 0, 0, 0.75)',

        // Focus mode gradients
        focusGradientFrom: { h: 340, s: 60, l: 58 },
        focusGradientTo: { h: 330, s: 55, l: 68 },
        focusPreferFrom: { h: 38, s: 92, l: 40 },
        focusPreferTo: { h: 340, s: 60, l: 58 },

        // Chart colors
        chart1: { h: 340, s: 55, l: 58 },
        chart2: { h: 320, s: 48, l: 53 },
        chart3: { h: 300, s: 50, l: 60 },
        chart4: { h: 38, s: 82, l: 45 },
        chart5: { h: 280, s: 50, l: 58 },
      }
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Deep blues for clarity and depth',
    isBuiltIn: true,
    colors: {
      light: {
        // Core colors - Light mode
        background: { h: 210, s: 40, l: 98 },
        foreground: { h: 222, s: 84, l: 5 },
        card: { h: 210, s: 40, l: 96 },
        cardForeground: { h: 222, s: 84, l: 5 },
        popover: { h: 210, s: 40, l: 96 },
        popoverForeground: { h: 222, s: 84, l: 5 },
        primary: { h: 217, s: 91, l: 60 },
        primaryForeground: { h: 210, s: 40, l: 98 },
        secondary: { h: 210, s: 40, l: 93 },
        secondaryForeground: { h: 222, s: 47, l: 11 },
        muted: { h: 210, s: 40, l: 91 },
        mutedForeground: { h: 215, s: 16, l: 47 },
        accent: { h: 210, s: 40, l: 89 },
        accentForeground: { h: 222, s: 47, l: 11 },
        destructive: { h: 0, s: 84, l: 60 },
        destructiveForeground: { h: 210, s: 40, l: 98 },
        border: { h: 214, s: 32, l: 87 },
        input: { h: 214, s: 32, l: 87 },
        ring: { h: 217, s: 91, l: 60 },

        // Semantic colors
        colorPrefer: { h: 38, s: 92, l: 50 },
        colorPreferLight: { h: 48, s: 96, l: 89 },
        colorPreferDark: { h: 32, s: 95, l: 44 },
        colorDefer: { h: 215, s: 25, l: 27 },
        colorDeferLight: { h: 210, s: 40, l: 96 },
        colorSuccess: { h: 160, s: 84, l: 39 },
        colorSuccessLight: { h: 160, s: 84, l: 95 },
        colorWarning: { h: 25, s: 95, l: 53 },
        colorError: { h: 0, s: 84, l: 60 },
        colorInfo: { h: 199, s: 89, l: 48 },
        colorHighlight: { h: 199, s: 89, l: 85 },

        // Glass morphism
        glassBg: 'rgba(219, 234, 254, 0.22)',
        glassBorder: 'rgba(147, 197, 253, 0.25)',
        glassCard: 'rgba(255, 255, 255, 0.92)',

        // Focus mode gradients
        focusGradientFrom: { h: 217, s: 91, l: 60 },
        focusGradientTo: { h: 199, s: 89, l: 48 },
        focusPreferFrom: { h: 38, s: 92, l: 50 },
        focusPreferTo: { h: 217, s: 91, l: 60 },

        // Chart colors - ocean palette
        chart1: { h: 221, s: 83, l: 53 },
        chart2: { h: 199, s: 89, l: 48 },
        chart3: { h: 190, s: 90, l: 50 },
        chart4: { h: 38, s: 92, l: 50 },
        chart5: { h: 160, s: 84, l: 39 },
      },
      dark: {
        // Core colors - Dark mode
        background: { h: 222, s: 47, l: 11 },
        foreground: { h: 210, s: 40, l: 98 },
        card: { h: 222, s: 47, l: 13 },
        cardForeground: { h: 210, s: 40, l: 98 },
        popover: { h: 222, s: 47, l: 13 },
        popoverForeground: { h: 210, s: 40, l: 98 },
        primary: { h: 217, s: 91, l: 60 },
        primaryForeground: { h: 210, s: 40, l: 98 },
        secondary: { h: 222, s: 47, l: 18 },
        secondaryForeground: { h: 210, s: 40, l: 98 },
        muted: { h: 217, s: 33, l: 22 },
        mutedForeground: { h: 215, s: 20, l: 65 },
        accent: { h: 217, s: 33, l: 25 },
        accentForeground: { h: 210, s: 40, l: 98 },
        destructive: { h: 0, s: 72, l: 51 },
        destructiveForeground: { h: 210, s: 40, l: 98 },
        border: { h: 217, s: 33, l: 22 },
        input: { h: 217, s: 33, l: 22 },
        ring: { h: 217, s: 91, l: 60 },

        // Semantic colors
        colorPrefer: { h: 38, s: 92, l: 50 },
        colorPreferLight: { h: 48, s: 70, l: 20 },
        colorPreferDark: { h: 32, s: 95, l: 44 },
        colorDefer: { h: 215, s: 25, l: 20 },
        colorDeferLight: { h: 210, s: 20, l: 18 },
        colorSuccess: { h: 160, s: 84, l: 39 },
        colorSuccessLight: { h: 160, s: 40, l: 20 },
        colorWarning: { h: 25, s: 95, l: 53 },
        colorError: { h: 0, s: 84, l: 60 },
        colorInfo: { h: 199, s: 89, l: 48 },
        colorHighlight: { h: 199, s: 70, l: 35 },

        // Glass morphism
        glassBg: 'rgba(17, 24, 39, 0.22)',
        glassBorder: 'rgba(59, 130, 246, 0.15)',
        glassCard: 'rgba(0, 0, 0, 0.65)',

        // Focus mode gradients
        focusGradientFrom: { h: 217, s: 91, l: 50 },
        focusGradientTo: { h: 199, s: 89, l: 38 },
        focusPreferFrom: { h: 38, s: 92, l: 40 },
        focusPreferTo: { h: 217, s: 91, l: 50 },

        // Chart colors
        chart1: { h: 221, s: 73, l: 43 },
        chart2: { h: 199, s: 79, l: 38 },
        chart3: { h: 190, s: 80, l: 40 },
        chart4: { h: 38, s: 82, l: 45 },
        chart5: { h: 160, s: 74, l: 34 },
      }
    }
  }
]

export function getThemeById(id: string): Theme | undefined {
  return builtInThemes.find(theme => theme.id === id)
}