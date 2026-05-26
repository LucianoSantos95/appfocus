import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SEGMENT_LABELS: Record<string, string> = {
  agencia: 'agência',
  consultoria: 'consultoria',
  freelancer: 'freelancer',
  pme: 'PME',
}

const STEPS = [
  { step: 1, days: 1, type: 'onboarding-reengagement-d1' },
  { step: 2, days: 3, type: 'onboarding-reengagement-d3' },
  { step: 3, days: 7, type: 'onboarding-reengagement-d7' },
]

const ADMIN_EMAIL = 'oluciano.dosantos@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cronSecret = Deno.env.get('CRON_SECRET')
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!(auth === serviceKey || (cronSecret && auth === cronSecret))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const results: any[] = []

  try {
    const { data: sessions, error } = await supabase
      .from('onboarding_sessions')
      .select('user_id, segment, started_at, completed_modules, last_reengagement_step')
      .is('completed_at', null)
      .lt('last_reengagement_step', 3)

    if (error) throw error

    for (const s of sessions || []) {
      const daysSince = Math.floor((Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24))
      const nextStep = STEPS.find(st => st.step === (s.last_reengagement_step || 0) + 1)
      if (!nextStep || daysSince < nextStep.days) continue

      const { data: userData } = await supabase.auth.admin.getUserById(s.user_id)
      const email = userData?.user?.email
      if (!email || email === ADMIN_EMAIL) continue

      const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', s.user_id).maybeSingle()

      const completedCount = Array.isArray(s.completed_modules) ? s.completed_modules.length : 0

      const sendUrl = `${supabaseUrl}/functions/v1/send-followup-email`
      const resp = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          to: email,
          type: nextStep.type,
          displayName: prof?.display_name?.split(' ')[0],
          templateData: {
            completedModules: completedCount,
            totalModules: 3,
            segmentLabel: s.segment ? SEGMENT_LABELS[s.segment] : undefined,
          },
        }),
      })

      const ok = resp.ok
      results.push({ email, step: nextStep.step, status: ok ? 'sent' : 'failed' })

      if (ok) {
        await supabase.from('onboarding_sessions')
          .update({ last_reengagement_step: nextStep.step })
          .eq('user_id', s.user_id)

        await supabase.from('email_automation_log').insert({
          user_id: s.user_id,
          automation_type: 'onboarding_reengagement',
          sequence_step: nextStep.step,
          template_name: nextStep.type,
          recipient_email: email,
          status: 'sent',
          metadata: { week_key: null, days_since_signup: daysSince },
        })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('cron-onboarding-reengagement error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
