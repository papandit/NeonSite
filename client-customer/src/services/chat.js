import { api } from './api';

/** Send the conversation to the backend (Gemini or fallback). Returns { reply, configured }. */
export function sendChat(messages) {
  return api.post('/chat', { messages }).then((r) => r.data.data);
}
