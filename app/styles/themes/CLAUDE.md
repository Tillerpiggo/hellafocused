# Theme System Documentation

## CRITICAL: Tailwind Config Location

**⚠️ IMPORTANT: The Tailwind config is at `/tailwind.config.js`**

Always edit `tailwind.config.js` at the project root when adding new colors!

## How the Theme System Works

### 1. CSS Variable Definition Chain

The theme system uses CSS variables that cascade through multiple files:

1. **Base Theme** (`/app/styles/themes/base.css`)
   - Defines default CSS variables on `:root`
   - Provides fallback values for all theme variables
   - Dark mode variants on `.dark` selector

2. **Theme-Specific Files** (`/app/styles/themes/*.css`)
   - Override base variables using `[data-theme="theme-name"]` selector
   - Each theme has light and dark mode variants
   - Example: `[data-theme="pink-zen"]` and `[data-theme="pink-zen"].dark`

3. **Import Order** (in `/app/layout.tsx`)
   - base.css must be imported first (provides fallbacks)
   - Then import all theme files

### 2. Adding New Colors

To add a new color that works across all themes:

#### Step 1: Add CSS Variables to ALL Theme Files

**⚠️ CRITICAL: You must add the new color to:**
1. `base.css` (for fallback)
2. **EVERY theme file in `/app/styles/themes/`**

Start with base.css (fallback):
```css
/* In base.css */
:root {
  --my-new-color: 340 82% 96%;  /* HSL format without hsl() */
}

.dark {
  --my-new-color: 340 55% 12%;
}
```

Then add to **EVERY** theme file with theme-appropriate values:
```css
/* In each theme file (pink-zen.css, ocean-blue.css, etc.) */
[data-theme="theme-name"] {
  --my-new-color: [theme-appropriate-hsl];  /* Match this theme's color palette */
}

[data-theme="theme-name"].dark {
  --my-new-color: [theme-appropriate-dark-hsl];
}
```

**Why this matters:** 
- If you skip a theme file, that theme will fall back to base.css values
- This breaks the visual consistency of that theme
- Users switching themes will see inconsistent colors

#### Step 2: Add to Tailwind Config

**Edit `/tailwind.config.js` (NOT the .ts file!):**
```javascript
colors: {
  // ... existing colors
  myNewColor: 'hsl(var(--my-new-color))',
  // For colors with variants:
  myColor: {
    DEFAULT: 'hsl(var(--my-color))',
    hover: 'hsl(var(--my-color-hover))',
    border: 'hsl(var(--my-color-border))'
  }
}
```

#### Step 3: Restart Dev Server

After adding new colors to the config, you MUST restart the dev server:
```bash
# Kill the server (Ctrl+C) then:
npm run dev
```

### 3. Adding a New Theme

When creating a new theme:

1. Create a new file: `/app/styles/themes/your-theme.css`
2. Copy ALL variables from an existing theme file as a template
3. Adjust color values to match your new theme's palette
4. Import it in `/app/layout.tsx` after base.css
5. Test that ALL colors work correctly in both light and dark modes

### 4. Why Colors Might Not Work

Common issues and solutions:

1. **Config Not Updating**: Tailwind config changes not being picked up
   - Solution: Make sure you're editing `/tailwind.config.js` and restart dev server
2. **JIT Compilation**: Tailwind only generates classes it finds in your code
   - Solution: Use the class somewhere or add to `safelist` in config
3. **Caching**: Next.js/Turbopack might cache the old config
   - Solution: Restart dev server, or in extreme cases: `rm -rf .next`
4. **CSS Variable Not Defined**: Variable doesn't exist in base.css
   - Solution: Always define variables in base.css first
5. **Missing Theme Overrides**: Color looks wrong in some themes
   - Solution: Ensure you've added the color to ALL theme files

### 5. Color Naming Conventions

- Use lowercase for simple colors: `pink`, `testcolor`
- Avoid camelCase for color names (can cause issues)
- For multi-part names, use lowercase without spaces: `highlightbg` not `highlightBg`
- Or use nested objects: `highlight: { bg: '...', border: '...' }`

### 6. Testing Checklist

When adding a new color:

- [ ] Added to base.css (light and dark)
- [ ] Added to ALL theme files (light and dark)
- [ ] Added to tailwind.config.js
- [ ] Restarted dev server
- [ ] Tested in all themes
- [ ] Tested in both light and dark modes
- [ ] Verified color matches each theme's palette

### 7. Quick Debugging

If a color isn't working:
1. Test CSS variable exists: `style={{ backgroundColor: 'hsl(var(--my-color))' }}`
2. Check if class is generated: Inspect element in devtools
3. Verify you edited the .js config, not .ts
4. Ensure server was restarted after config changes
5. Check ALL theme files have the variable defined

## Example: Adding a New UI Color

Let's add a "highlight-button" color system:

1. **Check existing theme files:**
```bash
ls app/styles/themes/
# Lists: base.css, pink-zen.css, ocean-blue.css, [any other themes]
```

2. **Add to base.css:**
```css
:root {
  --highlight-button-bg: 220 13% 91%;     /* Neutral fallback */
  --highlight-button-text: 220 13% 20%;
}

.dark {
  --highlight-button-bg: 220 13% 18%;
  --highlight-button-text: 220 13% 90%;
}
```

3. **Add to EACH theme file with appropriate colors:**

For a pink theme:
```css
[data-theme="pink-zen"] {
  --highlight-button-bg: 340 82% 96%;   /* Pink tint */
  --highlight-button-text: 345 25% 35%;
}
```

For a blue theme:
```css
[data-theme="ocean-blue"] {
  --highlight-button-bg: 210 82% 96%;   /* Blue tint */
  --highlight-button-text: 210 25% 35%;
}
```

4. **Add to tailwind.config.js:**
```javascript
colors: {
  highlightbg: 'hsl(var(--highlight-button-bg))',
  highlighttext: 'hsl(var(--highlight-button-text))'
}
```

5. **Use in components:**
```jsx
<Button className="bg-highlightbg text-highlighttext" />
```

Remember: The key to a good theme system is consistency - every theme must define every color variable!