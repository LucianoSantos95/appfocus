import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'oluciano.dosantos@gmail.com'
const MIN_SCORE = 15

function getWeekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, serviceKey)
  if (auth !== serviceKey) {
    const { data: valid } = await supabase.rpc('verify_cron_token', { p_token: auth ?? '' })
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }
  const weekKey = getWeekKey()
  const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const minSignupIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const results: any[] = []

  try {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('plan', 'gratuito')
      .eq('status', 'active')

    for (const sub of subs || []) {
      const uid = sub.user_id
      const { data: userData } = await supabase.auth.admin.getUserById(uid)
      const u = userData?.user
      if (!u?.email || u.email === ADMIN_EMAIL) continue
      if (u.created_at && u.created_at > minSignupIso) continue

      const { data: existing } = await supabase
        .from('email_automation_log')
        .select('id')
        .eq('user_id', uid)
        .eq('automation_type', 'power_user_upgrade')
        .filter('metadata->>week_key', 'eq', weekKey)
        .maybeSingle()
      if (existing) continue

      const counts = await Promise.all(
        ['clientes', 'projetos', 'tarefas', 'transacoes'].map(async (t) => {
          const { count } = await supabase.from(t).select('id', { count: 'exact', head: true })
            .eq('user_id', uid).gte('created_at', sinceIso)
          return count || 0
        })
      )
      const [clientesCount, projetosCount, tarefasCount, transacoesCount] = counts
      const registros = counts.reduce((a, b) => a + b, 0)
      const modulosAtivos = counts.filter(c => c > 0).length
      const score = registros + modulosAtivos * 5

      if (score < MIN_SCORE) continue

      const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', uid).maybeSingle()

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-followup-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          to: u.email,
          type: 'power-user-upgrade-digest',
          displayName: prof?.display_name?.split(' ')[0],
          templateData: { clientesCount, projetosCount, tarefasCount, transacoesCount },
        }),
      })

      results.push({ email: u.email, score, status: resp.ok ? 'sent' : 'failed' })

      if (resp.ok) {
        await supabase.from('email_automation_log').insert({
          user_id: uid,
          automation_type: 'power_user_upgrade',
          sequence_step: 1,
          template_name: 'power-user-upgrade-digest',
          recipient_email: u.email,
          status: 'sent',
          metadata: { week_key: weekKey, score, clientesCount, projetosCount, tarefasCount, transacoesCount },
        })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('cron-power-user-upgrade error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
