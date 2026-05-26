import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import { FollowupWelcomeEmail } from '../_shared/email-templates/followup-welcome.tsx'
import { FollowupReengagementEmail } from '../_shared/email-templates/followup-reengagement.tsx'
import { FollowupUpgradeEmail } from '../_shared/email-templates/followup-upgrade.tsx'
import { OnboardingReengagementD1Email } from '../_shared/email-templates/onboarding-reengagement-d1.tsx'
import { OnboardingReengagementD3Email } from '../_shared/email-templates/onboarding-reengagement-d3.tsx'
import { OnboardingReengagementD7Email } from '../_shared/email-templates/onboarding-reengagement-d7.tsx'
import { PowerUserUpgradeDigestEmail } from '../_shared/email-templates/power-user-upgrade-digest.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_URL = 'https://app.focusinteligente.com.br'
const PLANS_URL = `${SITE_URL}/planos`
const FROM_EMAIL = 'Focus Gestão Inteligente <noreply@app.focusinteligente.com.br>'

const EMAIL_TEMPLATES: Record<string, { component: React.ComponentType<any>, subject: string }> = {
  welcome: {
    component: FollowupWelcomeEmail,
    subject: 'Bem-vindo ao Focus Gestão Inteligente! 🚀',
  },
  reengagement: {
    component: FollowupReengagementEmail,
    subject: 'Você já explorou tudo no Focus?',
  },
  upgrade: {
    component: FollowupUpgradeEmail,
    subject: 'Desbloqueie todo o potencial do Focus ✨',
  },
  'onboarding-reengagement-d1': {
    component: OnboardingReengagementD1Email,
    subject: 'Você está a poucos passos do seu cupom de 20% OFF',
  },
  'onboarding-reengagement-d3': {
    component: OnboardingReengagementD3Email,
    subject: '⏰ Seu cupom de 20% OFF expira em 5 dias',
  },
  'onboarding-reengagement-d7': {
    component: OnboardingReengagementD7Email,
    subject: '❌ Última chance: cupom expira em 48h',
  },
  'power-user-upgrade-digest': {
    component: PowerUserUpgradeDigestEmail,
    subject: 'Sua operação está crescendo no Focus 🚀',
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow service-role callers (the cron-followup function or backend jobs).
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!SERVICE_ROLE_KEY || authHeader !== SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { to, type, displayName, templateData } = await req.json()

    if (!to || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const templateConfig = EMAIL_TEMPLATES[type]
    if (!templateConfig) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const templateProps: Record<string, any> = {
      siteUrl: SITE_URL,
      plansUrl: PLANS_URL,
      ...(templateData && typeof templateData === 'object' ? templateData : {}),
    }
    if (displayName) templateProps.displayName = displayName

    const html = await renderAsync(
      React.createElement(templateConfig.component, templateProps)
    )
    const text = await renderAsync(
      React.createElement(templateConfig.component, templateProps),
      { plainText: true }
    )

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: templateConfig.subject,
        html,
        text,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error', { status: resendResponse.status, data: resendData })
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Follow-up email sent', { type, to, id: resendData.id })

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('send-followup-email error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
