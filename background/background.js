// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Ad Violence extension installed');
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-violence') {
    chrome.storage.local.get(['violenceEnabled'], (result) => {
      const newState = !result.violenceEnabled;
      chrome.storage.local.set({ violenceEnabled: newState });

      // Notify active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TOGGLE_VIOLENCE',
            enabled: newState
          });
        }
      });
    });
  }
});
