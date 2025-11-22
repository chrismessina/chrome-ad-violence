class PersistenceManager {
  constructor() {
    this.storageKey = `ad-violence-impacts-${window.location.hostname}${window.location.pathname}`;
  }

  saveImpacts(impacts) {
    // Debounce saving to avoid hitting storage limits too fast
    if (this.saveTimeout) clearTimeout(this.saveTimeout);

    this.saveTimeout = setTimeout(() => {
      try {
        chrome.storage.local.set({ [this.storageKey]: impacts }, () => {
          if (chrome.runtime.lastError) {
            console.warn('Ad Violence: Failed to save impacts', chrome.runtime.lastError);
          }
        });
      } catch (e) {
        console.error('Ad Violence: Error saving impacts', e);
      }
    }, 1000);
  }

  loadImpacts(callback) {
    chrome.storage.local.get([this.storageKey], (result) => {
      const impacts = result[this.storageKey] || [];
      callback(impacts);
    });
  }

  clearImpacts() {
    chrome.storage.local.remove(this.storageKey);
  }
}

window.PersistenceManager = PersistenceManager;
