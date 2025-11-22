document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('violence-toggle');
  const tacticalToggle = document.getElementById('tactical-toggle');
  const debugToggle = document.getElementById('debug-toggle');
  const statusText = document.getElementById('status-text');
  const weaponBtns = document.querySelectorAll('.weapon-btn');
  const resetBtn = document.getElementById('reset-btn');
  const armoryBtn = document.getElementById('open-armory-btn');

  // Load initial state
  chrome.storage.local.get(['violenceEnabled', 'currentWeapon', 'tacticalMode', 'debugMode'], (result) => {
    if (result.violenceEnabled) {
      toggle.checked = true;
      statusText.textContent = 'Violence: ON';
    }

    if (result.tacticalMode !== false) { // Default to true if undefined
      tacticalToggle.checked = true;
    }

    if (result.debugMode) {
      debugToggle.checked = true;
    }

    const currentWeapon = result.currentWeapon || 'pistol';
    updateActiveWeapon(currentWeapon);
  });

  // Listen for storage changes (e.g., from armory window)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.currentWeapon) {
      updateActiveWeapon(changes.currentWeapon.newValue);
    }
  });

  // Toggle Violence Mode
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    statusText.textContent = isEnabled ? 'Violence: ON' : 'Violence: OFF';

    chrome.storage.local.set({ violenceEnabled: isEnabled });

    // Notify content script
    sendMessageToContent({ type: 'TOGGLE_VIOLENCE', enabled: isEnabled });
  });

  // Toggle Tactical Mode
  tacticalToggle.addEventListener('change', () => {
    const isEnabled = tacticalToggle.checked;
    chrome.storage.local.set({ tacticalMode: isEnabled });
    sendMessageToContent({ type: 'TOGGLE_TACTICAL', enabled: isEnabled });
  });

  // Toggle Debug Mode
  debugToggle.addEventListener('change', () => {
    const isEnabled = debugToggle.checked;
    chrome.storage.local.set({ debugMode: isEnabled });
    sendMessageToContent({ type: 'TOGGLE_DEBUG', enabled: isEnabled });
  });

  // Weapon Selection
  weaponBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const weapon = btn.dataset.weapon;
      updateActiveWeapon(weapon);
      chrome.storage.local.set({ currentWeapon: weapon });
      sendMessageToContent({ type: 'CHANGE_WEAPON', weapon: weapon });
    });
  });

  // Reset Damage
  resetBtn.addEventListener('click', () => {
    sendMessageToContent({ type: 'RESET_DAMAGE' });
  });

  // Open Armory
  armoryBtn.addEventListener('click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup/armory.html'),
      type: 'popup',
      width: 1000,
      height: 700
    });
  });

  function updateActiveWeapon(weapon) {
    weaponBtns.forEach(btn => {
      if (btn.dataset.weapon === weapon) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function sendMessageToContent(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});
