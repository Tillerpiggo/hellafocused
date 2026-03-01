# Current Work: Theme System Migration

## What We're Building
Migrating from a static CSS-based theme system to a data-driven JavaScript theme system that enables:
- Dynamic theme switching
- User customization (future)
- Database storage of custom themes (future)
- Theme preview cards with live components

## Current Status
We are in the middle of implementing the core theme system. Files created so far:
- ✅ `/lib/theme-system/types.ts` - Type definitions for themes
- ✅ `/lib/theme-system/themes.ts` - Built-in theme data (pink-zen and ocean-blue)
- ✅ `/lib/theme-system/utils.ts` - Helper functions for CSS generation
- 🚧 `/lib/theme-system/theme-provider.tsx` - In progress (was interrupted)

## Architecture Overview

### Before (Current System)
```
CSS Files → Applied via [data-theme="name"] → Browser renders
```
- Themes defined in `/app/styles/themes/*.css`
- Applied via CSS cascade
- No programmatic access to theme data

### After (New System)
```
Theme Objects → JavaScript applies CSS variables → Browser renders
```
- Themes defined as TypeScript objects
- Applied via JavaScript at runtime
- Full programmatic access for previews/customization

## Key Design Decisions

1. **Dual Theme Systems**:
   - `next-themes` handles light/dark/system mode
   - Our theme system handles color themes (pink-zen, ocean-blue, etc.)

2. **CSS Variables Still Used**:
   - We inject them via JavaScript instead of CSS files
   - Maintains performance benefits of CSS variables

3. **Theme Object Structure**:
   ```typescript
   Theme {
     id: string
     name: string
     colors: {
       light: ColorPalette
       dark: ColorPalette
     }
   }
   ```

4. **Performance Optimizations**:
   - CSS caching in Map
   - requestAnimationFrame for smooth application
   - Batch CSS variable updates

## Next Steps

1. **Complete theme-provider.tsx** - Need to finish the ThemeSystemProvider component
2. **Update app/layout.tsx** - Replace CSS imports with ThemeSystemProvider
3. **Test functionality** - Ensure themes work exactly as before
4. **Create theme cards** - Build preview components for theme selection
5. **Documentation** - Create THEME_CARDS.md and THEME_BACKEND.md

## Files to Update/Create

### Immediate (for MVP):
- [ ] Complete `/lib/theme-system/theme-provider.tsx`
- [ ] Update `/app/layout.tsx` to use new system
- [ ] Remove static theme imports from layout

### Documentation:
- [ ] `/docs/THEME_CARDS.md` - How to build theme preview cards
- [ ] `/docs/THEME_BACKEND.md` - Database integration plan

### Future (Phase 2):
- [ ] Theme selection UI in `/components/tabs/theme-view.tsx`
- [ ] Theme preview cards
- [ ] Custom theme editor
- [ ] Database integration

## Important Context

- **Goal**: Minimal implementation that maintains exact current functionality
- **Colors**: All color values extracted from existing CSS files (exact matches)
- **Mode**: Light/dark mode still handled by next-themes
- **Backwards Compatible**: Visual appearance should be identical

## Current Issue
We were in the middle of creating the `theme-provider.tsx` file when interrupted. This file is crucial as it:
- Manages active theme state
- Applies CSS variables to the DOM
- Integrates with next-themes for light/dark mode
- Provides context for theme access throughout the app

## Testing Plan
Once complete, verify:
1. Pink Zen theme looks identical to before
2. Ocean Blue theme looks identical to before
3. Light/dark mode switching still works
4. Theme persists on refresh (localStorage)
5. No performance degradation

## Questions/Decisions Pending
- Should we keep the old CSS files as fallback initially?
- How to handle theme migration for existing users?
- Custom theme limits per user?
- Theme sharing mechanism?