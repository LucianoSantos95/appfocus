import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_EMAIL = 'oluciano.dosantos@gmail.com'
const SITE_URL = 'https://app.focusinteligente.com.br'
// Send at D+3 — user is still warm and coupon is still valid
const TRIGGER_DAYS = 3

const MESSAGES: Record<string, Record<string, string>> = {
  demo: {
    agencia:
      `Oi {nome}! 👋\n\nSeu Hub de agência ainda está esperando você.\n\nVocê tem um cupom de *20% OFF* válido por mais 5 dias — finaliza a configuração em 3 minutos?\n\n👉 ${SITE_URL}/onboarding`,
    consultoria:
      `Oi {nome}! 👋\n\nSeu Hub de consultoria está pronto mas incompleto.\n\nSeu cupom de *20% OFF* expira em breve. Retoma a configuração agora?\n\n👉 ${SITE_URL}/onboarding`,
    freelancer:
      `Oi {nome}! 👋\n\nSeu Hub está esperando seu primeiro cliente ou projeto.\n\nCupom de *20% OFF* ainda válido — leva 3 minutos para configurar.\n\n👉 ${SITE_URL}/onboarding`,
    pme:
      `Oi {nome}! 👋\n\nSeu Hub empresarial ainda não está completo.\n\nVocê tem *20% OFF* disponível — só terminar a configuração rápida.\n\n👉 ${SITE_URL}/onboarding`,
    default:
      `Oi {nome}! 👋\n\nSeu Hub ainda não está configurado. Você tem um cupom de *20% OFF* válido por mais 5 dias.\n\n👉 ${SITE_URL}/onboarding`,
  },
  exploring: {
    agencia:
      `Oi {nome}! 👋\n\nVocê começou a usar o Focus com seus dados reais — ótima decisão!\n\nSeu próximo passo: cadastrar seu primeiro cliente. Leva 30 segundos.\n\n👉 ${SITE_URL}/clientes`,
    consultoria:
      `Oi {nome}! 👋\n\nVocê escolheu usar o Focus com seus dados reais. Que tal criar seu primeiro projeto agora?\n\nLeva menos de 2 minutos.\n\n👉 ${SITE_URL}/projetos`,
    freelancer:
      `Oi {nome}! 👋\n\nVocê já está no Focus com seus dados reais.\n\nSeu próximo passo: registrar um recebimento. Qualquer valor, de qualquer cliente.\n\n👉 ${SITE_URL}/financas`,
    pme:
      `Oi {nome}! 👋\n\nVocê começou a usar o Focus de verdade — agora é só dar o primeiro passo.\n\nCadastre um cliente ou uma transação. Leva 2 minutos.\n\n👉 ${SITE_URL}`,
    default:
      `Oi {nome}! 👋\n\nVocê começou a usar o Focus com seus dados reais.\n\nSeu primeiro lançamento leva menos de 2 minutos — vamos lá?\n\n👉 ${SITE_URL}`,
  },
}

function buildMessage(track: 'demo' | 'exploring', segment: string | null, firstName: string): string {
  const trackMessages = MESSAGES[track]
  const template = (segment && trackMessages[segment]) ?? trackMessages.default
  return template.replace('{nome}', firstName)
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured')
    return false
  }

  const cleanNumber = phone.replace(/\D/g, '')
  // Ensure Brazilian country code is present
  const e164 = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
  const whatsappTo = `whatsapp:+${e164}`
  const whatsappFrom = `whatsapp:${fromNumber.startsWith('+') ? fromNumber : '+' + fromNumber}`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const credentials = btoa(`${accountSid}:${authToken}`)

  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: whatsappTo, From: whatsappFrom, Body: message }),
  })

  const data = await resp.json()
  if (!resp.ok) {
    console.error(`Twilio error for ${phone}:`, data)
    return false
  }
  console.log(`WhatsApp sent to +${e164}, SID: ${data.sid}`)
  return true
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

  const results: any[] = []

  try {
    // Users who are inactive, have a phone, and haven't received a WhatsApp reengagement yet
    const { data: sessions, error } = await supabase
      .from('onboarding_sessions')
      .select('user_id, segment, current_step, started_at')
      .is('completed_at', null)

    if (error) throw error

    for (const s of sessions || []) {
      const daysSince = Math.floor(
        (Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince < TRIGGER_DAYS) continue

      const { data: userData } = await supabase.auth.admin.getUserById(s.user_id)
      const email = userData?.user?.email
      if (!email || email === ADMIN_EMAIL) continue

      // Skip if already sent a WhatsApp reengagement to this user
      const { data: existing } = await supabase
        .from('email_automation_log')
        .select('id')
        .eq('user_id', s.user_id)
        .eq('automation_type', 'whatsapp_reengagement')
        .maybeSingle()
      if (existing) continue

      // Require phone number in profiles
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .eq('user_id', s.user_id)
        .maybeSingle()

      if (!prof?.phone) continue

      const firstName = (prof.display_name ?? email).split(' ')[0]
      const track = s.current_step === 'exploring' ? 'exploring' : 'demo'
      const message = buildMessage(track, s.segment, firstName)

      const sent = await sendWhatsApp(prof.phone, message)
      results.push({ phone: prof.phone.slice(-4).padStart(8, '*'), track, status: sent ? 'sent' : 'failed' })

      if (sent) {
        await supabase.from('email_automation_log').insert({
          user_id: s.user_id,
          automation_type: 'whatsapp_reengagement',
          sequence_step: 1,
          template_name: `whatsapp-${track}-d${TRIGGER_DAYS}`,
          recipient_email: email,
          status: 'sent',
          metadata: { days_since_signup: daysSince, track, segment: s.segment },
        })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('cron-whatsapp-reengagement error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
