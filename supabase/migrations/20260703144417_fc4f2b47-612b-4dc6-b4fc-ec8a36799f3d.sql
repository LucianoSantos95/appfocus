
create type public.funnel_stage as enum ('novo','ativado','quente','convertido','churn');

create table public.user_funnel_stage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stage public.funnel_stage not null default 'novo',
  score integer not null default 0,
  activated_at timestamptz,
  hot_at timestamptz,
  converted_at timestamptz,
  churn_at timestamptz,
  last_activity_at timestamptz,
  last_computed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.user_funnel_stage to authenticated;
grant all on public.user_funnel_stage to service_role;

alter table public.user_funnel_stage enable row level security;

create policy "Users read their funnel stage"
  on public.user_funnel_stage for select
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create policy "Admins update funnel stage"
  on public.user_funnel_stage for update
  to authenticated
  using (public.has_role(auth.uid(),'admin'));

create table public.sales_touchpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','call','manual','system')),
  reason text not null,
  outcome text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

grant select, insert on public.sales_touchpoints to authenticated;
grant all on public.sales_touchpoints to service_role;

alter table public.sales_touchpoints enable row level security;

create policy "Users read their own touchpoints"
  on public.sales_touchpoints for select
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create policy "Admins insert touchpoints"
  on public.sales_touchpoints for insert
  to authenticated
  with check (public.has_role(auth.uid(),'admin') or created_by = auth.uid());

create index idx_sales_touchpoints_user on public.sales_touchpoints(user_id, created_at desc);

create or replace function public.init_funnel_stage()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.user_funnel_stage(user_id, stage) values (new.user_id, 'novo')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger trg_init_funnel_stage
  after insert on public.profiles
  for each row execute function public.init_funnel_stage();

insert into public.user_funnel_stage(user_id, stage)
select p.user_id, 'novo' from public.profiles p
on conflict (user_id) do nothing;

create or replace function public.sync_funnel_from_subscription()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.plan is not null and lower(new.plan) <> 'gratuito' and new.status = 'active' then
    insert into public.user_funnel_stage(user_id, stage, converted_at)
    values (new.user_id, 'convertido', coalesce(new.started_at, now()))
    on conflict (user_id) do update set
      stage = 'convertido',
      converted_at = coalesce(public.user_funnel_stage.converted_at, coalesce(new.started_at, now())),
      updated_at = now();
  elsif (new.status in ('canceled','past_due','unpaid')) then
    update public.user_funnel_stage
       set stage = case when stage = 'convertido' then 'churn' else stage end,
           churn_at = case when stage = 'convertido' then now() else churn_at end,
           updated_at = now()
     where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger trg_sync_funnel_subscription
  after insert or update on public.subscriptions
  for each row execute function public.sync_funnel_from_subscription();

update public.user_funnel_stage f
   set stage = 'convertido',
       converted_at = coalesce(f.converted_at, s.started_at, now()),
       updated_at = now()
  from public.subscriptions s
 where s.user_id = f.user_id
   and s.status = 'active'
   and lower(s.plan) <> 'gratuito';

create or replace function public.recompute_funnel_stage(p_user_id uuid)
returns public.user_funnel_stage
language plpgsql security definer set search_path=public as $$
declare
  v_records int := 0;
  v_modules int := 0;
  v_last_activity timestamptz;
  v_score int := 0;
  v_stage public.funnel_stage;
  v_current public.user_funnel_stage;
begin
  select * into v_current from public.user_funnel_stage where user_id = p_user_id;
  if not found then
    insert into public.user_funnel_stage(user_id, stage) values (p_user_id, 'novo')
      returning * into v_current;
  end if;

  if v_current.stage in ('convertido','churn') then
    return v_current;
  end if;

  with counts as (
    select
      (select count(*) from public.clientes where user_id = p_user_id) as c_clientes,
      (select count(*) from public.projetos where user_id = p_user_id) as c_projetos,
      (select count(*) from public.tarefas where user_id = p_user_id) as c_tarefas,
      (select count(*) from public.transacoes where user_id = p_user_id) as c_transacoes,
      (select count(*) from public.colaboradores where user_id = p_user_id) as c_colab
  )
  select
    (c_clientes + c_projetos + c_tarefas + c_transacoes + c_colab)::int,
    ((case when c_clientes>0 then 1 else 0 end)
    + (case when c_projetos>0 then 1 else 0 end)
    + (case when c_tarefas>0 then 1 else 0 end)
    + (case when c_transacoes>0 then 1 else 0 end)
    + (case when c_colab>0 then 1 else 0 end))::int
  into v_records, v_modules
  from counts;

  select greatest(
    (select max(created_at) from public.clientes where user_id = p_user_id),
    (select max(created_at) from public.projetos where user_id = p_user_id),
    (select max(created_at) from public.tarefas where user_id = p_user_id),
    (select max(created_at) from public.transacoes where user_id = p_user_id),
    (select last_sign_in_at from public.profiles where user_id = p_user_id)
  ) into v_last_activity;

  v_score := v_records + v_modules * 5;
  if v_last_activity is not null and v_last_activity > now() - interval '7 days' then
    v_score := v_score + 10;
  end if;

  if v_records = 0 then
    v_stage := 'novo';
  elsif v_modules >= 3 and v_score >= 25 and v_last_activity > now() - interval '14 days' then
    v_stage := 'quente';
  else
    v_stage := 'ativado';
  end if;

  update public.user_funnel_stage
     set stage = v_stage,
         score = v_score,
         last_activity_at = v_last_activity,
         activated_at = coalesce(activated_at, case when v_stage <> 'novo' then now() end),
         hot_at = coalesce(hot_at, case when v_stage = 'quente' then now() end),
         last_computed_at = now(),
         updated_at = now()
   where user_id = p_user_id
  returning * into v_current;

  return v_current;
end;
$$;

grant execute on function public.recompute_funnel_stage(uuid) to service_role;
grant execute on function public.recompute_funnel_stage(uuid) to authenticated;

create or replace view public.vw_funnel_summary as
select
  stage,
  count(*)::int as usuarios,
  coalesce(avg(score),0)::int as score_medio,
  count(*) filter (where last_activity_at > now() - interval '7 days')::int as ativos_7d
from public.user_funnel_stage
group by stage;

grant select on public.vw_funnel_summary to service_role;
