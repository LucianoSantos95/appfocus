SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
 'followup-emails-daily','whatsapp-daily-scheduler','cron-onboarding-reengagement',
 'cron-power-user-upgrade','cron-funnel-progression-6h','asaas-renew-charges-daily','cron-daily-brief');