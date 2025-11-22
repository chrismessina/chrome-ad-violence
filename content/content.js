
console.log('Ad Violence: Content script loaded');

// State
let violenceEnabled = false;
let currentWeapon = 'pistol';
let persistenceManager = null;
let effectsEngine = null;
let audioManager = null;
let hoveredElement = null;
let tacticalMode = true;
let debugMode = false;
const elementHealthMap = new WeakMap();
const damagedElements = new Set();

// Weapon Configuration
const WeaponStats = {
  pistol: { damage: 10, size: 6, automatic: false },
  shotgun: { damage: 40, size: 8, automatic: false },
  rpg: { damage: 100, size: 15, automatic: false },
  flamethrower: { damage: 2, size: 30, automatic: true, fireRate: 50 },
  rifle: { damage: 15, size: 5, automatic: true, fireRate: 100 },
  laser: { damage: 25, size: 6, automatic: false }
};

let isFiring = false;
let fireTimer = null;

// Initialize
function init() {
  persistenceManager = new PersistenceManager();
  audioManager = new AudioManager();

  // Check initial state
  chrome.storage.local.get(['violenceEnabled', 'currentWeapon', 'tacticalMode', 'debugMode'], (result) => {
    violenceEnabled = !!result.violenceEnabled;
    currentWeapon = result.currentWeapon || 'pistol';
    tacticalMode = result.tacticalMode !== false; // Default true
    debugMode = !!result.debugMode;

    // Always load existing damage
    loadExistingDamage();

    if (violenceEnabled) {
      enableViolence();
    }
  });
}

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_VIOLENCE':
      violenceEnabled = message.enabled;
      if (violenceEnabled) {
        enableViolence();
      } else {
        disableViolence();
      }
      break;
    case 'TOGGLE_TACTICAL':
      tacticalMode = message.enabled;
      if (!tacticalMode && effectsEngine) {
        effectsEngine.clearHighlight();
      }
      break;
    case 'TOGGLE_DEBUG':
      debugMode = message.enabled;
      break;
    case 'CHANGE_WEAPON':
      currentWeapon = message.weapon;
      updateCursor();
      break;
    case 'RESET_DAMAGE':
      resetDamage();
      break;
  }
});

function enableViolence() {
  console.log('Ad Violence: Enabled');

  // Start background music
  if (audioManager) {
    audioManager.playBackgroundMusic();
  }

  // Show "Violence On" UI
  showViolenceModal(true);

  // Remove death overlay if exists
  const deathOverlay = document.getElementById('violence-death-overlay');
  if (deathOverlay) deathOverlay.remove();

  createCanvasOverlay();

  // Restore canvas position if it was smeared
  if (effectsEngine && effectsEngine.canvas) {
    effectsEngine.canvas.classList.remove('canvas-smeared');
    effectsEngine.canvas.style.pointerEvents = 'auto';

    // Attach all event listeners to the canvas
    const canvas = effectsEngine.canvas;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', preventDefaultClick);
  }

  updateCursor();
}

function disableViolence() {
  console.log('Ad Violence: Disabled');
  document.body.style.cursor = 'default';

  // Stop background music
  if (audioManager) {
    audioManager.stopBackgroundMusic();
  }

  // Stop firing if currently firing
  stopFiring();

  // Show "Violence Off" UI
  showViolenceModal(false);

  // Add death overlay
  const overlay = document.createElement('div');
  overlay.id = 'violence-death-overlay';
  overlay.className = 'death-overlay';
  document.body.appendChild(overlay);

  // Remove after animation (2s fade in + 1s hold)
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.transition = 'opacity 1s ease-out';
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
      }, 1000);
    }
  }, 3000);

  if (effectsEngine && effectsEngine.canvas) {
    const canvas = effectsEngine.canvas;
    canvas.style.pointerEvents = 'none';
    // Smear effect
    canvas.classList.add('canvas-smeared');

    // Remove event listeners
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('click', preventDefaultClick);

    // Clear highlight
    if (effectsEngine) effectsEngine.clearHighlight();
  }

  hoveredElement = null;
}

function preventDefaultClick(e) {
  if (violenceEnabled) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function showViolenceModal(isOn) {
  // Remove existing modal
  const existing = document.getElementById('violence-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'violence-modal';
  modal.className = `violence-modal ${isOn ? 'on' : 'off'}`;
  modal.textContent = isOn ? 'VIOLENCE ON' : 'VIOLENCE OFF';

  document.body.appendChild(modal);

  // Remove after animation
  setTimeout(() => {
    if (modal.parentNode) modal.remove();
  }, 2000);
}

function updateCursor() {
  if (!violenceEnabled || !effectsEngine || !effectsEngine.canvas) return;

  const cursorUrl = chrome.runtime.getURL('assets/crosshair.png');
  // Apply cursor to canvas specifically since it now captures events
  effectsEngine.canvas.style.cursor = `url("${cursorUrl}") 16 16, crosshair`;
}

function createCanvasOverlay() {
  if (document.getElementById('ad-violence-canvas')) return;

  const c = document.createElement('canvas');
  c.id = 'ad-violence-canvas';
  c.style.position = 'fixed';
  c.style.top = '0';
  c.style.left = '0';
  c.style.width = '100vw';
  c.style.height = '100vh';
  c.style.zIndex = '999999';
  c.style.pointerEvents = 'none'; // Initially none, enabled in enableViolence

  document.body.appendChild(c);

  // Initialize Effects Engine
  const ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  effectsEngine = new EffectsEngine(c, ctx);

  // Handle resize
  window.addEventListener('resize', () => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    effectsEngine.redrawAll();
  });
}

// Mouse position tracking
let lastMouseX = 0;
let lastMouseY = 0;

function handleMouseMove(e) {
  if (!violenceEnabled) return;

  // Update global mouse position
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // Target Highlighting Logic
  if (tacticalMode) {
    // Use elementsFromPoint to find the element under the cursor
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let targetElement = null;

    for (const el of elements) {
      // Skip our canvas and basic containers
      if (el.id !== 'ad-violence-canvas' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
        targetElement = el;
        break;
      }
    }

    if (targetElement && targetElement !== hoveredElement) {
      hoveredElement = targetElement;
      const rect = targetElement.getBoundingClientRect();
      effectsEngine.drawHighlight({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
    } else if (!targetElement && hoveredElement) {
      hoveredElement = null;
      effectsEngine.clearHighlight();
    }
  }
}

function handleMouseDown(e) {
  if (!violenceEnabled) return;
  if (e.button !== 0) return; // Only left click

  e.preventDefault();
  e.stopPropagation();

  // Update last mouse position immediately
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const stats = WeaponStats[currentWeapon];

  // Fire once immediately
  performShot(e.clientX, e.clientY);

  // Start loop if automatic
  if (stats.automatic) {
    console.log('Starting fire loop for', currentWeapon);
    isFiring = true;
    startFireLoop();
  }
}

function handleMouseUp(e) {
  if (isFiring) {
    console.log('Stopping fire loop (mouseup)');
    stopFiring();
  }
}

function handleMouseLeave(e) {
  // Stop firing if mouse leaves the canvas
  if (isFiring) {
    console.log('Stopping fire loop (mouseleave)');
    stopFiring();
  }
  // Clear highlight when mouse leaves
  if (hoveredElement && effectsEngine) {
    hoveredElement = null;
    effectsEngine.clearHighlight();
  }
}

function startFireLoop() {
  if (fireTimer) clearInterval(fireTimer);

  const stats = WeaponStats[currentWeapon];
  fireTimer = setInterval(() => {
    if (!isFiring) {
      stopFiring();
      return;
    }
    // Use last known mouse position
    performShot(lastMouseX, lastMouseY);
  }, stats.fireRate);
}

function stopFiring() {
  isFiring = false;
  if (fireTimer) {
    clearInterval(fireTimer);
    fireTimer = null;
  }
}

function performShot(x, y) {
  // Audio
  audioManager.playWeaponSound(currentWeapon);

  // Visuals
  const stats = WeaponStats[currentWeapon];
  effectsEngine.addImpact(x, y, currentWeapon, stats.size);

  // Persistence - save the entire impacts array
  persistenceManager.saveImpacts(effectsEngine.impacts);

  // Logic: Damage Element
  // Use elementsFromPoint to drill through the canvas without needing to toggle pointer-events
  const elements = document.elementsFromPoint(x, y);
  let target = null;

  for (const el of elements) {
    // Skip our canvas, the cursor, and basic containers if possible
    if (el.id !== 'ad-violence-canvas' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
      target = el;
      break;
    }
  }

  if (target) {
    console.log('Hit target:', target.tagName, target.className);
    applyDamage(target, stats.damage);
  } else {
    console.log('No valid target found at', x, y);
  }
}

function applyDamage(element, damageAmount) {
  // Track this element as damaged
  damagedElements.add(element);

  // Calculate health if not exists
  if (!elementHealthMap.has(element)) {
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    // 500x500 = 250000 area. Sqrt = 500. Health = 250.
    const maxHealth = Math.max(20, Math.sqrt(area) / 2);
    elementHealthMap.set(element, maxHealth);
  }

  let currentHealth = elementHealthMap.get(element);
  currentHealth -= damageAmount;
  elementHealthMap.set(element, currentHealth);

  // Visual feedback (shake)
  element.style.transition = 'transform 0.05s';
  element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
  setTimeout(() => {
    element.style.transform = 'none';
  }, 50);

  console.log('Target Health:', currentHealth, 'DebugMode:', debugMode, 'Element:', element.tagName);

  if (debugMode) {
    console.log('Showing health popup for', element.tagName);
    showHealthPopup(element, currentHealth);
  }

  if (currentHealth <= 0) {
    destroyElement(element);
  } else {
    // Maybe darken it?
  }
}

function destroyElement(element) {
  // Track destroyed element
  damagedElements.add(element);

  // Trigger destruction effect on canvas
  if (effectsEngine) {
    const rect = element.getBoundingClientRect();
    effectsEngine.addDestructionEffect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    });
  }

  // Play destruction sound?

  // Visual destruction of the actual element
  element.style.transition = 'opacity 0.3s, transform 0.3s';
  element.style.opacity = '0';
  element.style.transform = 'scale(0.8)';
  element.style.pointerEvents = 'none';

  setTimeout(() => {
    element.style.visibility = 'hidden';
    // Let's try visibility hidden first.
  }, 300);
}

function showHealthPopup(element, current) {
  const rect = element.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.textContent = `HP: ${Math.floor(current)}`;
  popup.style.position = 'fixed';
  popup.style.left = `${rect.left + rect.width / 2}px`;
  popup.style.top = `${rect.top + rect.height / 2}px`;
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.background = 'rgba(0, 0, 0, 0.8)';
  popup.style.color = current > 0 ? '#00ff00' : '#ff0000';
  popup.style.padding = '4px 8px';
  popup.style.borderRadius = '4px';
  popup.style.fontSize = '14px';
  popup.style.fontWeight = 'bold';
  popup.style.pointerEvents = 'none';
  popup.style.zIndex = '1000000';
  popup.style.transition = 'opacity 0.5s, transform 0.5s';

  document.body.appendChild(popup);

  // Animate up and fade out
  requestAnimationFrame(() => {
    popup.style.transform = 'translate(-50%, -100%)';
    popup.style.opacity = '0';
  });

  setTimeout(() => {
    popup.remove();
  }, 500);
}

function resetDamage() {
  // Stop any ongoing automatic firing
  stopFiring();

  // Clear visual impacts
  if (effectsEngine) {
    effectsEngine.clear();
  }

  // Clear storage
  persistenceManager.clearImpacts();

  // Restore all damaged/destroyed elements
  damagedElements.forEach(element => {
    element.style.opacity = '';
    element.style.visibility = '';
    element.style.transform = '';
    element.style.pointerEvents = '';
    element.style.transition = '';
  });

  // Clear tracking sets
  damagedElements.clear();
  // Note: elementHealthMap will naturally reset as elements are re-damaged
}

function loadExistingDamage() {
  // TEMPORARY: Clear old impacts to prevent crashes from format changes
  // Remove this after users have had time to clear their caches
  persistenceManager.clearImpacts();
  console.log('Cleared old impacts for compatibility');

  /* ORIGINAL CODE - Re-enable after cache cleared
  persistenceManager.loadImpacts((impacts) => {
    if (impacts.length > 0) {
      createCanvasOverlay();
      impacts.forEach(impact => {
        // Ensure effectsEngine is initialized before adding impacts
        if (effectsEngine) {
          effectsEngine.addImpact(impact.x, impact.y, impact.weapon, impact.size);
        }
      });
    }
  });
  */
}

// Start
init();

