-- Optional seed rivals. Never treat these as live players in production UI.
-- Enable display with NEXT_PUBLIC_SHOW_SEED_DATA=true in development only.

insert into public.profiles (user_id, username, display_name, avatar, level, xp, is_guest, is_seed)
values
  ('00000000-0000-0000-0000-000000000001', 'RIVAL_01', 'RIVAL_01', 'orb-1', 12, 2400, false, true),
  ('00000000-0000-0000-0000-000000000002', 'RIVAL_02', 'RIVAL_02', 'orb-2', 9, 1600, false, true)
on conflict (user_id) do nothing;
