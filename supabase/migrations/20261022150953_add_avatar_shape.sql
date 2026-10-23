alter table public.profiles
  add column if not exists avatar_shape text not null default 'round';

alter table public.profiles
  drop constraint if exists profiles_avatar_shape_check;

alter table public.profiles
  add constraint profiles_avatar_shape_check
  check (avatar_shape in ('round', 'square'));
