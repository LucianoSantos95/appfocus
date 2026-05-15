import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Follow-up schedule: type -> days after signup
const FOLLOWUP_SCHEDULE = [
  { type: 'welcome', daysAfterSignup: 1 },
  { type: 'reengagement', daysAfterSignup: 5 },
  { type: 'upgrade', daysAfterSignup: 14 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cronSecret = Deno.env.get('CRON_SECRET')

  // Require either the service-role key or a configured CRON_SECRET to trigger.
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
  const isAuthorized =
    (authHeader && authHeader === supabaseServiceKey) ||
    (cronSecret && authHeader === cronSecret)
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const results: Array<{ type: string; email: string; status: string }> = []

  try {
    for (const schedule of FOLLOWUP_SCHEDULE) {
      // Find users who signed up exactly N days ago (within a 1-day window)
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - schedule.daysAfterSignup)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

      if (error) {
        console.error(`Error querying profiles for ${schedule.type}:`, error.message)
        continue
      }

      if (!profiles || profiles.length === 0) continue

      // Get emails from auth.users via admin API
      for (const profile of profiles) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          profile.user_id
        )

        if (userError || !userData?.user?.email) {
          console.error(`Could not get email for user ${profile.user_id}`)
          continue
        }

        // Only send to users on free plan
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .single()

        // Skip upgrade emails for paid users
        if (schedule.type === 'upgrade' && subscription?.plan && subscription.plan !== 'gratuito') {
          continue
        }

        // Call send-followup-email function
        const sendUrl = `${supabaseUrl}/functions/v1/send-followup-email`
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: userData.user.email,
            type: schedule.type,
            displayName: profile.display_name,
          }),
        })

        const responseData = await response.json()
        results.push({
          type: schedule.type,
          email: userData.user.email,
          status: response.ok ? 'sent' : 'failed',
        })
      }
    }

    console.log('Cron followup completed', { totalSent: results.filter(r => r.status === 'sent').length })

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('cron-followup error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
