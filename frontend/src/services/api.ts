/**
 * Central API client configuration for connecting LegalLingo Frontend to FastAPI Backend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface BackendHealth {
  status: 'ok' | 'degraded' | 'error';
  service: string;
}

export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    return null;
  }
}
