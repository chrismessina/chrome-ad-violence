# Ad Violence

A Chrome extension that turns any webpage into an interactive shooting gallery. Click to shoot DOM elements, watch them take damage, and obliterate them with various weapons and dramatic destruction effects.

## Features

### 🎯 Interactive Gameplay
- **Click to Shoot**: Target and shoot any element on a webpage
- **Health System**: Each DOM element has health points that decrease as you shoot them
- **Destruction Effects**: Elements shatter, explode, or disintegrate when destroyed
- **Persistent Damage**: Damage is saved and persists across page reloads

### 🔫 Arsenal of Weapons
Choose from six different weapons, each with unique behavior:
- **🔫 Pistol**: Classic single-shot weapon
- **💥 Shotgun**: Spread damage across multiple elements
- **🔥 Flamethrower**: Continuous fire mode for sustained damage
- **🚀 RPG**: High-impact explosive rounds
- **💀 Automatic Rifle**: Rapid-fire automatic weapon
- **⚡ Laser**: Precision energy weapon

### 🎨 3D Armory
- Immersive 3D weapon selection interface
- GLB 3D models powered by Three.js
- Interactive weapon preview before selection

### 🎮 Gameplay Modes
- **Tactical Mode**: Highlights targetable elements as you hover
- **Debug Mode**: Shows health bars on all shootable elements
- **Violence Mode**: Toggle the entire shooting overlay on/off

### 🎵 Audio Experience
- Background music (Nine Inch Nails-style MIDI)
- Weapon sound effects
- Destruction audio cues

### ⌨️ Keyboard Shortcuts
- **Alt+V**: Toggle Violence Mode on/off

## Installation

### From Source
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-add-violence` directory
6. The extension icon should appear in your Chrome toolbar

## Usage

### Getting Started
1. Click the extension icon in your Chrome toolbar to open the popup
2. Toggle "Violence Mode" to ON
3. Select your weapon from the grid
4. Click on any element on the webpage to shoot it!

### Opening the Armory
1. Click "🎯 Open Armory" in the popup
2. Browse 3D weapon models in an immersive interface
3. Click a weapon to select it
4. Close the armory to return to shooting

### Tactical and Debug Modes
- **Tactical Mode**: Enable to see outlines around shootable elements when you hover over them
- **Debug Mode**: Enable to see health bars on all elements, making it easier to track damage

### Resetting Damage
- Click "Reset Damage" in the popup to restore all elements to full health

## Project Structure

```
chrome-add-violence/
├── manifest.json              # Extension configuration
├── assets/                    # Icons and resources
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── crosshair.png
│   └── models/                # 3D weapon models (.glb)
├── background/                # Background service worker
│   └── background.js
├── content/                   # Content scripts injected into pages
│   ├── content.js             # Main violence mode logic
│   ├── effects_engine.js      # Destruction effects engine
│   ├── persistence.js         # Damage persistence system
│   ├── audio_manager.js       # Audio playback manager
│   ├── style.css              # Violence mode styles
│   └── ui_effects.css         # UI animation styles
├── popup/                     # Extension popup interface
│   ├── popup.html
│   ├── popup.js
│   ├── style.css
│   ├── armory.html            # 3D armory interface
│   ├── armory.js
│   └── armory.css
├── libs/                      # Third-party libraries
│   └── three/                 # Three.js for 3D rendering
└── debug/                     # Debug utilities
```

## Technical Details

### Technologies Used
- **Manifest V3**: Latest Chrome extension API
- **Three.js**: 3D rendering for the armory
- **Canvas API**: Destruction effects rendering
- **Chrome Storage API**: Persisting damage across sessions
- **Content Scripts**: DOM manipulation and interaction

### Permissions
- `activeTab`: Access to the current tab for shooting
- `storage`: Save damage data persistently
- `scripting`: Inject content scripts dynamically
- `<all_urls>`: Works on any webpage

### Content Security Policy
The extension uses local Three.js libraries to comply with Chrome's CSP requirements for Manifest V3.

## Development

### Making Changes
1. Edit the relevant files in the project
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on a webpage

### Debugging
- Use Chrome DevTools for content script debugging (inspect the page)
- Use the Extension popup inspector for popup debugging (right-click the popup)
- Check the service worker console in `chrome://extensions/` for background script debugging

## Known Features
- Damage persists across page reloads
- Works on most websites (some sites with strong CSP may block the extension)
- 3D models load from local files to comply with extension security policies
- "Butter Grunge" font for dramatic violence mode text effects

## Credits

Created with destructive intent 🎯

---

**Disclaimer**: This extension is for entertainment purposes only. No actual harm comes to websites - everything is purely visual and client-side. Refresh the page or use "Reset Damage" to restore everything to normal.
