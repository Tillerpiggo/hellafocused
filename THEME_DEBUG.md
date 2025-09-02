# Theme System Debug Summary

## What We're Trying to Do
Implement multiple color themes (Pink Zen, Ocean Blue) that users can switch between. Currently hardcoded to Pink Zen theme.

## Current Issue
Google Sign-in button colors aren't applying from the theme. The button appears with default gray colors instead of themed pink colors.

## What IS Working
- ✅ Theme system works for existing colors (`background`, `card`, `primary`, etc.)
- ✅ Test: Changed `--background` to bright green → worked
- ✅ Test: Changed `--card` to black → worked
- ✅ CSS variables are defined correctly in `/app/styles/themes/pink-zen.css`
- ✅ HTML has `data-theme="pink-zen"` attribute

## What's NOT Working
- ❌ Google button colors (`googleBg`, `googleBgHover`, `googleBorder`, `googleText`, `googleLogo`)
- ❌ Tailwind not generating CSS classes for these colors

## What We've Tried
1. **Initial approach**: Hyphenated names (`google-bg`, `google-bg-hover`)
   - Result: Didn't work, Tailwind doesn't support hyphenated color names

2. **Nested object approach**: 
   ```typescript
   google: { DEFAULT: "...", hover: "..." }
   ```
   - Result: Didn't work, classes not generated

3. **Simple string approach** (current):
   ```typescript
   googleBg: "hsl(var(--google-bg))",
   googleBgHover: "hsl(var(--google-bg-hover))",
   ```
   - Result: Still not working

## The Mystery
- Identical pattern to working colors (`background: "hsl(var(--background))"`)
- CSS variables exist and are correct
- But Tailwind won't generate classes for `bg-googleBg`, etc.
- No error messages, just silently fails

## Hardcoded Test
When we hardcode the colors directly in the button, they work perfectly:
```jsx
style={{
  backgroundColor: 'hsl(340 82% 96%)',
  borderColor: 'hsl(340 65% 82%)',
}}
```

## Next Steps Needed
- Figure out why Tailwind isn't generating classes for our custom google colors
- Possible cache issue?
- Possible Tailwind config parsing issue?
- Need to verify Tailwind is actually seeing these color definitions