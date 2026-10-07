-- Passo seguro para vincular a primeira conta ao perfil de administrador.
-- 1. Crie primeiro o usuário no Supabase Dashboard > Authentication > Users.
-- 2. Substitua EMAIL_COMPLETO pela mesma conta criada no passo 1.
-- 3. Execute esta consulta no SQL Editor do projeto Supabase.
-- A senha é definida no passo 1 e não deve ser escrita neste arquivo.

insert into public.staff_profiles (user_id, display_name, role, is_active, force_password_change)
select id, 'Administrador VG', 'admin', true, true
from auth.users
where lower(email) = lower('EMAIL_COMPLETO')
on conflict (user_id) do update
set role = 'admin', is_active = true, force_password_change = true
returning user_id, display_name, role, is_active, force_password_change;
