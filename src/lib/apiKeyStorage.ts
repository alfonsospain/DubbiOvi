const API_KEY_STORAGE_KEY = 'dubbiovi_gemini_api_key';

export function loadApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load API key from localStorage:', error);
    return null;
  }
}

export function saveApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } catch (error) {
    console.error('Failed to save API key to localStorage:', error);
  }
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear API key from localStorage:', error);
  }
}
