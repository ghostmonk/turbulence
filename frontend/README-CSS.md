# CSS Architecture Documentation

## Overview

This project uses a modular CSS architecture that combines design tokens, semantic component classes, and Tailwind CSS utilities for a maintainable and scalable styling system.

## 🏗️ Architecture

### File Structure
```
src/styles/
├── globals.css      # Main entry point, imports all other stylesheets
├── tokens.css       # Design tokens (colors, typography, spacing, etc.)
├── base.css         # Base HTML element styles and typography
├── components.css   # Reusable component classes
└── editor.css       # TipTap editor specific styles
```

## 🎨 Design Tokens

### Colors
Our color system uses semantic naming for better intent and maintainability:

```css
/* Brand Colors */
--color-brand-primary: #4f46e5;      /* Primary brand color */
--color-brand-secondary: #06b6d4;    /* Secondary brand color */

/* Surface Colors */
--color-surface-primary: #ffffff;    /* Main background */
--color-surface-secondary: #f9fafb;  /* Card/container background */
--color-surface-tertiary: #f3f4f6;   /* Subtle background */

/* Text Colors */
--color-text-primary: #111827;       /* Main text */
--color-text-secondary: #6b7280;     /* Secondary text */
--color-text-link: #4f46e5;          /* Links */
```

### Typography
Fluid typography scales responsively across devices:

```css
--font-size-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem);
--font-size-base: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);
--font-size-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 2rem);
```

### Spacing
Consistent spacing scale:

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-lg: 1rem;       /* 16px */
--space-xl: 1.5rem;     /* 24px */
```

## 🧩 Component Classes

### Cards
```html
<div class="card">Basic card</div>
<div class="card card--draft">Draft story card</div>
```

### Buttons
```html
<button class="btn btn--primary">Primary Button</button>
<button class="btn btn--secondary btn--sm">Small Secondary Button</button>
<button class="btn btn--danger">Delete Button</button>
```

**Button Variants:**
- `btn--primary` - Main call-to-action
- `btn--secondary` - Secondary actions
- `btn--danger` - Destructive actions
- `btn--warning` - Warning actions

**Button Sizes:**
- `btn--sm` - Small button
- Default size (no modifier)
- `btn--lg` - Large button

### Badges
```html
<span class="badge badge--draft">DRAFT</span>
<span class="badge badge--published">PUBLISHED</span>
```

### Navigation
```html
<nav class="nav">
  <div class="nav__container">
    <div class="nav__links">
      <a href="/" class="nav__link">Home</a>
    </div>
  </div>
</nav>
```

### Story Components
```html
<div class="story-header">
  <div class="story-header__actions">
    <!-- Action buttons -->
  </div>
  <h2 class="story-title story-title--link">Title</h2>
  <div class="story-header__meta">
    <!-- Metadata -->
  </div>
</div>
<div class="story-content prose">
  <!-- Rich content -->
</div>
```

### Grid System
```html
<div class="grid grid--responsive">
  <!-- Auto-responsive grid -->
</div>
<div class="grid grid--3-cols">
  <!-- 3-column grid -->
</div>
```

### Error and Empty States
```html
<div class="error-state">
  <h3 class="error-state__title">Error Title</h3>
  <p class="error-state__message">Error message</p>
</div>

<div class="empty-state">
  <h2 class="empty-state__title">No Content</h2>
</div>
```

## 🎭 Dark Mode Support

All components automatically support dark mode through CSS custom properties:

```css
.dark {
  --color-surface-primary: #0f172a;
  --color-text-primary: #f8fafc;
  /* ... */
}
```

## 🔧 Hot Reloading Setup

### Development with Docker

Use the development Docker setup for hot reloading:

```bash
# Build and run development container
docker-compose -f docker-compose.dev.yml up --build

# Or rebuild when dependencies change
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

The development setup includes:
- Volume mounting for source files
- Tailwind watch mode
- Next.js hot reloading
- CSS file watching

### Local Development

```bash
npm run dev:docker
```

This runs Next.js with `TAILWIND_MODE=watch` for CSS hot reloading.

## 🛠️ Migration Guide

### From Inline Tailwind to Component Classes

**Before:**
```html
<button className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
  Edit
</button>
```

**After:**
```html
<button className="btn btn--primary btn--sm">
  Edit
</button>
```

### Component Class Priority

1. **Use component classes first** - `btn`, `card`, `nav__link`
2. **Extend with Tailwind utilities** - `flex`, `items-center`, `gap-2`
3. **Use design token utilities** - `text-text-primary`, `bg-surface-secondary`
4. **Avoid hardcoded values** - Use tokens instead of arbitrary values

### Migration Checklist

- [ ] Replace button inline styles with `btn` classes
- [ ] Replace card styling with `card` classes
- [ ] Update navigation with `nav` classes
- [ ] Replace hardcoded colors with token classes
- [ ] Update typography with token classes
- [ ] Test dark mode functionality

## 📏 Best Practices

### CSS Organization
- **Tokens first** - Define design tokens before components
- **Component classes** - Create reusable classes for common patterns
- **BEM methodology** - Use Block__Element--Modifier for component variants
- **Single responsibility** - Each class should have one clear purpose

### Performance
- **CSS custom properties** - Used for theming and consistency
- **Modular imports** - Only import needed stylesheets
- **Minimal specificity** - Avoid deep nesting and high specificity

### Maintenance
- **Semantic naming** - Use descriptive names over visual descriptions
- **Documentation** - Document component usage and variants
- **Consistency** - Follow established patterns for new components

## 🧪 Testing Changes

### Visual Testing
1. Test light and dark themes
2. Check responsive breakpoints
3. Verify component variants
4. Test hover and focus states

### CSS Hot Reloading
Changes to these files trigger hot reloading:
- `src/styles/*.css`
- `tailwind.config.ts`
- `postcss.config.js`

## 🔍 Debugging

### Common Issues

**CSS not updating:**
- Check if Tailwind is in watch mode
- Restart development server
- Clear `.next` cache

**Colors not applying:**
- Verify token names in `tokens.css`
- Check dark mode class application
- Ensure custom properties are defined

**Component classes not working:**
- Verify import order in `globals.css`
- Check class names match definitions
- Ensure no Tailwind purging issues

### Development Tools
- Use browser DevTools to inspect custom properties
- Check computed styles for token values
- Verify CSS cascade and specificity

## 🚀 Future Enhancements

- [ ] Add animation tokens
- [ ] Implement focus management system
- [ ] Add print styles
- [ ] Create style guide component library
- [ ] Add CSS-in-JS integration for dynamic theming 