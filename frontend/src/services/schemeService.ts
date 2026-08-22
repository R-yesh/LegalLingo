import { Scheme } from '../types';
import { SAMPLE_SCHEMES } from '../data/sampleDocument';

export interface SchemeFilters {
  state?: string;
  occupation?: string;
  incomeBracket?: string;
  areaType?: string;
}

export async function getSchemes(filters?: SchemeFilters): Promise<Scheme[]> {
  await new Promise(r => setTimeout(r, 200));

  let results = [...SAMPLE_SCHEMES];

  if (filters?.state && filters.state !== 'All') {
    results = results.filter(s => s.state === 'All India' || s.state.toLowerCase() === filters.state?.toLowerCase());
  }

  return results;
}
