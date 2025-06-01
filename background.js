let deck = [];

// Dictionary API function
async function getDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const data = await response.json();
    
    if (data && data[0] && data[0].meanings[0]) {
      return data[0].meanings[0].definitions[0].definition;
    }
    return "No definition found";
  } catch (error) {
    console.error("Dictionary error:", error);
    return "Error fetching definition";
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "createFlashcard") {
    const definition = await getDefinition(request.text);
    
    const newCard = {
      front: request.text,
      back: definition,
      timestamp: Date.now()
    };
    
    deck.push(newCard);
    chrome.storage.local.set({ deck });
    
    // Notify user
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Flashcard Created",
      message: `Added: ${request.text}`
    });
  }
});

// Get deck for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDeck") {
    sendResponse({ deck });
  }
});