document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('enabled');
  const delayInput = document.getElementById('delay');

  chrome.storage.sync.get({ enabled: true, delayMs: 2000 }, (res) => {
    checkbox.checked = res.enabled !== false;
    delayInput.value = Number.isNaN(Number(res.delayMs)) ? 2000 : Number(res.delayMs);
  });

  checkbox.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: checkbox.checked });
  });

  delayInput.addEventListener('change', () => {
    const d = Number(delayInput.value);
    if (Number.isNaN(d) || d < 0) {
      delayInput.value = 0;
      chrome.storage.sync.set({ delayMs: 0 });
    } else {
      chrome.storage.sync.set({ delayMs: d });
    }
  });
});