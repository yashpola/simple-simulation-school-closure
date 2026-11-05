import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExperimentRun } from '@/types/experiment';
import { SAMPLE_EXP000 } from './sampleData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
};

const LOCAL_STORAGE_KEY = 'simulation_experiments_runs';

// Helper to access localStorage safely in Next.js SSR
const getLocalRuns = (): ExperimentRun[] => {
  if (typeof window === 'undefined') return [SAMPLE_EXP000];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([SAMPLE_EXP000]));
      return [SAMPLE_EXP000];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [SAMPLE_EXP000];
  } catch (err) {
    console.error('Failed to read from localStorage', err);
    return [SAMPLE_EXP000];
  }
};

const saveLocalRun = (run: ExperimentRun): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalRuns();
    const updated = [run, ...existing.filter((r) => r.id !== run.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
};

const deleteLocalRun = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalRuns();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete from localStorage', err);
  }
};

/**
 * Fetch all experiment runs.
 * Tries Supabase first; if not configured or query fails, falls back to localStorage.
 */
export async function getExperimentRuns(): Promise<{
  runs: ExperimentRun[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { runs: getLocalRuns(), source: 'local' };
  }

  try {
    const { data, error } = await client
      .from('experiment_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed, falling back to local:', error.message);
      return {
        runs: getLocalRuns(),
        source: 'local',
        error: `Supabase query error: ${error.message}. Loaded from local cache.`
      };
    }

    if (!data || data.length === 0) {
      // If table is empty, return local data (which has exp000)
      return { runs: getLocalRuns(), source: 'local' };
    }

    return { runs: data as ExperimentRun[], source: 'supabase' };
  } catch (err: any) {
    console.warn('Supabase network error, falling back to local:', err);
    return {
      runs: getLocalRuns(),
      source: 'local',
      error: err?.message || 'Failed to connect to Supabase.'
    };
  }
}

/**
 * Fetch a single experiment run by id.
 */
export async function getExperimentRunById(id: string): Promise<ExperimentRun | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('experiment_runs')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as ExperimentRun;
    } catch {
      // ignore and fallback
    }
  }

  const local = getLocalRuns();
  return local.find((r) => r.id === id) || null;
}

/**
 * Save an experiment run (e.g. after simulation completes).
 */
export async function saveExperimentRun(run: ExperimentRun): Promise<{
  success: boolean;
  source: 'supabase' | 'local';
  error?: string;
}> {
  // Always update local cache for instant UI feedback
  saveLocalRun(run);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, source: 'local' };
  }

  try {
    const { error } = await client.from('experiment_runs').upsert({
      id: run.id,
      created_at: run.created_at,
      name: run.name,
      description: run.description || '',
      status: run.status,
      config: run.config,
      results_control: run.results_control,
      results_treatment: run.results_treatment,
      evals: run.evals,
      metadata: run.metadata || {}
    });

    if (error) {
      console.warn('Supabase upsert failed:', error.message);
      return {
        success: false,
        source: 'local',
        error: `Saved locally, but Supabase sync failed: ${error.message}`
      };
    }

    return { success: true, source: 'supabase' };
  } catch (err: any) {
    return {
      success: false,
      source: 'local',
      error: `Saved locally, Supabase network exception: ${err?.message}`
    };
  }
}

/**
 * Delete an experiment run.
 */
export async function deleteExperimentRun(id: string): Promise<{ success: boolean }> {
  deleteLocalRun(id);
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('experiment_runs').delete().eq('id', id);
    } catch {
      // ignore
    }
  }
  return { success: true };
}

/**
 * Compute the next directory ID like 'exp001', 'exp002' based on existing runs.
 */
export async function getNextExperimentId(): Promise<string> {
  const { runs } = await getExperimentRuns();
  const expIndices: number[] = [];

  for (const r of runs) {
    if (r.id && r.id.startsWith('exp')) {
      const numPart = r.id.substring(3);
      if (/^\d+$/.test(numPart)) {
        expIndices.push(parseInt(numPart, 10));
      }
    }
  }

  const maxIndex = expIndices.length > 0 ? Math.max(...expIndices) : -1;
  const nextNum = maxIndex + 1;
  return `exp${String(nextNum).padStart(3, '0')}`;
}

