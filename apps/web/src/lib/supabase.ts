/**
 * ClassroomCare AI × NIU
 * Supabase Client Initialization & Environment Validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  statusMessage: string;
  setupInstructions: string[];
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(supabaseUrl && supabaseUrl.trim().length > 0 && supabaseUrl.startsWith('https://'));
  const hasKey = Boolean(supabaseAnonKey && supabaseAnonKey.trim().length > 0);
  const isConfigured = hasUrl && hasKey;

  return {
    isConfigured,
    hasUrl,
    hasKey,
    statusMessage: isConfigured
      ? 'Connected to configured Supabase Project.'
      : 'Supabase credentials are not configured in local environment (.env).',
    setupInstructions: [
      'Copy .env.example to .env at project root or in apps/web/.env.local',
      'Set VITE_SUPABASE_URL with your Supabase Project URL (e.g., https://xyzcompany.supabase.co)',
      'Set VITE_SUPABASE_ANON_KEY with your project Public/Anon key',
      'Never place SUPABASE_SERVICE_ROLE_KEY into frontend VITE_ variables',
    ],
  };
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfigStatus().isConfigured;
};

// Create client only if environment variables are provided
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
