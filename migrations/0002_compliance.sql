create table if not exists devices (
  id text primary key,
  user_id text not null,
  hostname text not null,
  agent_token text not null,
  os_version text,
  ip_address text,
  last_seen timestamptz,
  compliance_score numeric(5, 2),
  status text not null default 'offline',
  created_at timestamptz not null default now()
);
create index if not exists devices_user_id_idx on devices (user_id);

create table if not exists compliance_checks (
  id text primary key,
  user_id text not null,
  name text not null,
  description text,
  category text not null,
  check_type text not null,
  expected_value text,
  severity text not null default 'Medium',
  remediation text,
  is_builtin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists checks_user_id_idx on compliance_checks (user_id);

create table if not exists compliance_reports (
  id text primary key,
  user_id text not null,
  device_id text not null,
  compliance_score numeric(5, 2),
  passed_checks integer not null default 0,
  failed_checks integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reports_user_device_idx on compliance_reports (user_id, device_id);

create table if not exists device_check_results (
  id text primary key,
  user_id text not null,
  report_id text not null,
  check_id text,
  status text not null,
  actual_value text,
  message text
);
create index if not exists results_report_idx on device_check_results (report_id);

create table if not exists alerts (
  id text primary key,
  user_id text not null,
  device_id text not null,
  check_id text,
  severity text not null,
  message text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists alerts_user_idx on alerts (user_id, is_resolved, created_at desc);
