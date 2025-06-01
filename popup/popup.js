document.addEventListener('DOMContentLoaded', () => {
  const cardsDiv = document.getElementById('cards');
  const exportBtn = document.getElementById('export');
  
  // Load cards
  chrome.runtime.sendMessage({ action: "getDeck" }, (response) => {
    if (response.deck) {
      renderCards(response.deck);
    }
  });
  
  // Export function
  exportBtn.addEventListener('click', exportToCSV);
});

function renderCards(deck) {
  const cardsDiv = document.getElementById('cards');
  cardsDiv.innerHTML = '';
  
  if (deck.length === 0) {
    cardsDiv.innerHTML = '<p>No flashcards yet. Select text to create some!</p>';
    return;
  }
  
  deck.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
      <strong>${escapeHtml(card.front)}</strong><br>
      ${escapeHtml(card.back)}
    `;
    cardsDiv.appendChild(cardDiv);
  });
}

function exportToCSV() {
  chrome.runtime.sendMessage({ action: "getDeck" }, (response) => {
    if (!response.deck || response.deck.length === 0) {
      alert("No flashcards to export!");
      return;
    }
    
    // Create CSV content
    let csvContent = "Front,Back\n";
    response.deck.forEach(card => {
      csvContent += `"${escapeCsv(card.front)}","${escapeCsv(card.back)}"\n`;
    });
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'anki_flashcards.csv');
    link.click();
  });
}

// Helper functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsv(field) {
  return field.replace(/"/g, '""');
}