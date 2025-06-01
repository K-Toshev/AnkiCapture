// Listen for text selection
document.addEventListener('mouseup', async (event) => {
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0) {
    // Send to background script for processing
    chrome.runtime.sendMessage({
      action: "createFlashcard",
      text: selection
    });
  }
});