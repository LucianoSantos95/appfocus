---
name: Theme Preference
description: Dual theme support — Dark (default) and Light, both fully legible. User toggles via UserMenu.
type: design
---
The app now supports BOTH Dark Mode (default, premium tech-forward look) and Light Mode (high-contrast, fully legible).

- ThemeProvider in `src/contexts/ThemeContext.tsx` manages state, persists to localStorage (`hub-theme`), toggles `.light` / `.dark` class on `<html>`.
- Toggle lives in `UserMenu` (sidebar dropdown) with Sun/Moon icons.
- Light mode variables in `src/index.css` use deep blue primary (215 90% 48%), near-black foreground (215 30% 12%), white surfaces. Semantic colors (success/warning/destructive) are darkened so they stay readable on white.
- Light mode shadow/glass/gradient overrides ensure depth on white backgrounds.
- Chart tooltips use `hsl(var(--popover-foreground))` instead of hardcoded white so they remain readable in both themes.
- Default remains Dark for new users.
