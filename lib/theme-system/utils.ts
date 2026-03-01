import { HSLColor, ColorPalette } from './types'

export function hslToString(color: HSLColor): string {
  return `${color.h} ${color.s}% ${color.l}%`
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function generateCSSVariables(palette: ColorPalette): string {
  const variables: string[] = []

  Object.entries(palette).forEach(([key, value]) => {
    const cssVarName = `--${kebabCase(key)}`

    if (typeof value === 'string') {
      // For RGBA values (glass morphism)
      variables.push(`${cssVarName}: ${value}`)
    } else {
      // For HSL colors
      variables.push(`${cssVarName}: ${hslToString(value)}`)
    }
  })

  return variables.join('; ')
}

// Cache for generated CSS to improve performance
const cssCache = new Map<string, string>()

export function getCachedCSS(themeId: string, mode: string): string | undefined {
  return cssCache.get(`${themeId}-${mode}`)
}

export function setCachedCSS(themeId: string, mode: string, css: string): void {
  cssCache.set(`${themeId}-${mode}`, css)
}

export function clearCSSCache(): void {
  cssCache.clear()
}