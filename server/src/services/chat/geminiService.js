// Gemini chatbot service. Calls Google's Generative Language API via REST (no
// SDK). If no GEMINI_API_KEY is configured, the controller falls back to a
// canned reply so the widget still works.

import config from '../../config/index.js';

const SYSTEM_PROMPT = `You are the friendly, concise shopping assistant for "OWM NameCraft Ecom",
a custom name-plate store (Onewebmart). Help customers with:
- products (wood, brass, steel, acrylic, LED, resin name plates)
- customizing in the live editor (material, size, font, colour, background, border, mount, icons, and their name/subtitle text)
- pricing (shown live and server-verified), buying as-is vs customizing
- coupons (e.g. WELCOME10, FLAT200, FESTIVE15), shipping (free over Rs.2000, made to order, 5-7 business days), orders and design review.
Keep replies short, warm and helpful. If you are unsure, suggest browsing /products or emailing support@namecraft.local. Prices are in Indian Rupees.`;

export function isChatConfigured() {
  return Boolean(config.gemini.apiKey);
}

/**
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @returns {Promise<string>}
 */
export async function chatWithGemini(messages) {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return text.trim() || 'Sorry, I could not generate a response just now.';
}
