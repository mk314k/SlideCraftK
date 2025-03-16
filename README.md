# SlideCraftK

SlideCraftK is an interactive slide presentation platform designed for math, technical storytelling, and live programmable slides. Author decks with native KaTeX equations, Markdown blocks, code snippets, vector shapes, and live per-slide CSS/JS powered by `statebinderk`.

## Features

- **16:9 Scaled Stage (`1280x720`)**: Resolution-independent canvas with 8-direction resize handles, rotation, smart alignment guides, and `Shift`-grid snapping.
- **Native KaTeX Math**: Double-click any math element to edit raw LaTeX with live preview and syntax diagnostics.
- **Rich Elements**: Buttons, Textareas, Markdown blocks, Code blocks, Images, and SVG Shapes (rectangles, circles, arrows, lines).
- **Interactive Slide Scripting (`statebinderk`)**: Inject per-slide CSS and JavaScript with `window.StateBinder` (`StateVar`, `StyleVar`, `MultiStateVar`, `StateVarList`, `StyleVarList`) exposed globally.
- **Presentation Mode**: Fullscreen presenter with keyboard/click navigation, step-by-step fragment reveals, slide transitions (`none`, `fade`, `slide`), progress bar, and toggleable laser pointer (`L`).
- ** Export & Persistence**: Auto-saves to `localStorage`, exports/imports portable `.scs` (ScriptCraftedSlides) JSON files, and prints cleanly to landscape PDF.

## Getting Started

```bash
git clone https://github.com/mk314k/slidecraftk.git
cd slidecraftk
npm install
npm run dev
```

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete selected element |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + D` | Duplicate selected element |
| `Cmd/Ctrl + C` / `V` | Copy / Paste element |
| `Arrow Keys` (`Shift` for 10px) | Nudge selected element |
| `Double Click` | Inline edit text, Markdown, Code, or LaTeX |
| `→` / `Space` / `←` | Advance / retreat slide or fragment in Presentation Mode |
| `L` | Toggle laser pointer in Presentation Mode |
| `?` | Open keyboard shortcuts modal |

## `.scs` (ScriptCraftedSlides) Format Specification

A `.scs` file is a JSON array of `SerializedSlide` objects:

```json
[
  {
    "background": "#eef2ff",
    "transition": "fade",
    "customCss": "",
    "customJs": "",
    "notes": "Speaker notes for slide 1",
    "elemProp": [
      {
        "id": 0,
        "name": "latex",
        "x": 180,
        "y": 200,
        "width": 920,
        "height": 200,
        "rotation": 0,
        "step": 1,
        "inner": "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
        "style": {
          "fontSize": "24px",
          "color": "#111827"
        }
      }
    ]
  }
]
```

## Scripting Interactive Slides with `statebinderk`

Every element on the active slide is wrapped in a container `<div id="{eid}div">` and inner element `<... id="{eid}">`. In the **Add CSS/JS** panel, you can bind reactive state directly to slide elements:

```javascript
const bgVar = new window.StyleVar('#4f46e5', '2div', 'background');
bgVar.transition('#10b981');
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
