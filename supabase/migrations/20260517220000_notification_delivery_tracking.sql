alter table public.notifications
  add column if not exists push_sent_at timestamptz null,
  add column if not exists email_sent_at timestamptz null,
  add column if not exists delivery_error text null;
