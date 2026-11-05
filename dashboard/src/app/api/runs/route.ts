import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ExperimentRun } from '@/types/experiment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http') || supabaseUrl.includes('your-project-id')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ configured: false, runs: [] });
  }

  try {
    const { data, error } = await supabase
      .from('experiment_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ configured: true, error: error.message, runs: [] }, { status: 500 });
    }

    return NextResponse.json({ configured: true, runs: data });
  } catch (err: any) {
    return NextResponse.json({ configured: true, error: err.message, runs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ configured: false, message: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as ExperimentRun;
    const { error } = await supabase.from('experiment_runs').upsert({
      id: body.id,
      created_at: body.created_at || new Date().toISOString(),
      name: body.name,
      description: body.description || '',
      status: body.status || 'completed',
      config: body.config,
      results_control: body.results_control,
      results_treatment: body.results_treatment,
      evals: body.evals,
      metadata: body.metadata || {},
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

