import { Scheme } from '../types';
import { API_BASE_URL } from './api';

export interface SchemeFilters {
  state?: string;
  occupation?: string;
  incomeBracket?: string;
  areaType?: string;
}

/**
 * Fetches the welfare-scheme catalogue from the backend (GET /api/schemes).
 * Throws on failure — callers (SchemesPage) show a real error state rather
 * than silently falling back to fabricated data.
 */
export async function getSchemes(filters?: SchemeFilters): Promise<Scheme[]> {
  const params = new URLSearchParams();
  if (filters?.state) params.set('state', filters.state);
  if (filters?.occupation) params.set('occupation', filters.occupation);
  if (filters?.incomeBracket) params.set('incomeBracket', filters.incomeBracket);
  if (filters?.areaType) params.set('areaType', filters.areaType);

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/schemes${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load schemes (status ${response.status}).`);
  }

  return response.json();
}
