revoke all on public.vw_funnel_summary from anon, authenticated;
grant select on public.vw_funnel_summary to service_role;