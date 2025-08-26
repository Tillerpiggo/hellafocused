# Claude Instructions

## /commit Command Process
When the user runs `/commit`:
1. Run `npm run build`
2. Fix any build errors that occur
3. Stage the relevant files with `git add`
4. Create the commit with an appropriate message
5. Push to the remote branch with `git push origin <current-branch>`

## General Rule
Never attribute yourself as co-author in any commit messages.

- Do not attribute yourself as author to commit messages
- don't attribute yourself to commit messages

## Code Comments
- Avoid comments that plainly describe what the code does without adding useful information not obviously implied by the code. BAD: `// fetch data - fetchData()`. GOOD: `fetchData()` (no comment needed unless this has some side effect)

## Glass Morphism Styling (Cross-Browser Support)

When implementing glass morphism effects (glassy/frosted glass appearance), always follow this pattern for cross-browser compatibility:

### CSS Classes Available:
- `glass-morphism` - Standard glass effect for sidebars and panels
- `glass-mobile-sidebar` - Higher opacity glass for mobile sidebars
- `glass-dropdown` - Glass effect optimized for dropdown menus

### Implementation Pattern:
All glass morphism classes in `app/globals.css` follow this structure:
1. Base styles (background, border, box-shadow) that work everywhere
2. `-webkit-backdrop-filter` with @supports for Safari/older WebKit browsers
3. Standard `backdrop-filter` with @supports for modern browsers
4. Separate dark mode variants with adjusted opacity/blur values

### Example Structure:
```css
.glass-effect {
  /* Fallback for browsers without backdrop-filter */
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Safari and older WebKit browsers */
@supports (-webkit-backdrop-filter: blur(12px)) {
  .glass-effect {
    -webkit-backdrop-filter: blur(12px) saturate(1.1);
  }
}

/* Modern browsers */
@supports (backdrop-filter: blur(12px)) {
  .glass-effect {
    backdrop-filter: blur(12px) saturate(1.1);
  }
}

/* Dark mode variant */
.dark .glass-effect {
  background: rgba(0, 0, 0, 0.85);
  /* ... adjusted colors ... */
}
```

### Why This Pattern?
- **Fallback Support**: The base rgba background ensures the UI is usable even without blur support
- **Safari Compatibility**: The `-webkit-` prefix is required for Safari and iOS browsers
- **Progressive Enhancement**: Uses @supports to only apply blur when available
- **Dark Mode**: Separate dark variants ensure proper contrast in both themes