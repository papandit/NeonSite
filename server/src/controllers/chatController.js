// POST /api/chat  { messages: [{ role, content }] }
// Returns { reply, configured }. Falls back to a helpful canned reply when the
// Gemini key isn't set, so the widget always works.

import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import { chatWithGemini, isChatConfigured } from '../services/chat/geminiService.js';

const FALLBACK =
  "Our AI assistant isn't switched on yet, but here's the gist: browse Products and open the live editor to customize a plate (material, size, font, colour, background, icons, and your name). " +
  'Prices update live, shipping is free over ₹2000, and you can use code WELCOME10. Add a Gemini API key on the server to enable live chat.';

export const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    throw ApiError.badRequest('messages array is required');
  }

  // Keep the last ~12 turns, cap each message length.
  const trimmed = messages
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))
    .filter((m) => m.content.trim());

  if (!(await isChatConfigured())) {
    return sendSuccess(res, { reply: FALLBACK, configured: false });
  }

  try {
    const reply = await chatWithGemini(trimmed);
    return sendSuccess(res, { reply, configured: true });
  } catch (err) {
    console.error('[chat] Gemini error:', err.message);
    return sendSuccess(res, {
      reply: "Sorry, I'm having trouble reaching the assistant right now. Please try again in a moment.",
      configured: true,
      error: true,
    });
  }
});
