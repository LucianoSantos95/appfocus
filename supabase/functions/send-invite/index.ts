import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { sendResendEmail } from '../_shared/resend.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_URL = 'https://app.focusinteligente.com.br'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, token, inviter_name } = await req.json()

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return json(400, { error: 'E-mail inválido' })
    }
    if (typeof token !== 'string' || token.length < 8) {
      return json(400, { error: 'Token inválido' })
    }

    const confirmationUrl = `${SITE_URL}/auth?invite=${encodeURIComponent(token)}`

    const html = await renderAsync(
      React.createElement(InviteEmail, {
        siteName: 'Focus Gestão Inteligente',
        siteUrl: SITE_URL,
        confirmationUrl,
      })
    )

    const inviter = typeof inviter_name === 'string' && inviter_name.trim()
      ? inviter_name.trim()
      : null

    const result = await sendResendEmail({
      to: email.trim(),
      subject: inviter
        ? `${inviter} convidou você para o Hub Empresarial`
        : 'Você foi convidado para o Hub Empresarial',
      html,
      text: `Você foi convidado para o Focus Gestão Inteligente. Aceite o convite: ${confirmationUrl}`,
    })

    if (!result.ok) {
      console.error('[send-invite] falha ao enviar:', result.error)
      return json(502, { error: result.error ?? 'Falha ao enviar e-mail' })
    }

    return json(200, { success: true, id: result.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-invite] erro:', msg)
    return json(500, { error: msg })
  }
})
