// Gemini API key — set by user via sidebar input
let geminiKey = "";

function generateBack() {
  const front   = selectedTerm;
  const prompt  = shadow.getElementById("ai-prompt").value.trim();
  const preview = shadow.getElementById("ai-preview");
  const btn     = shadow.getElementById("btn-generate");

  if (!front) return;

  preview.textContent = "Generating...";
  preview.className   = "stage-box empty";
  btn.disabled        = true;

  const userMessage = prompt
    ? `Front of flashcard: "${front}"\n\nInstructions: ${prompt}`
    : `Create a clear, concise flashcard back for the front: "${front}"`;

  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userMessage }] }]
    })
  })
  .then(r => r.json())
  .then(data => {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    preview.textContent = text;
    preview.className   = "stage-box has-content";
    shadow.getElementById("btn-add").disabled = false;
  })
  .catch(err => {
    preview.textContent = "Error: " + err.message;
  })
  .finally(() => { btn.disabled = false; });
}