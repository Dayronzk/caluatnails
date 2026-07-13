-- Insert a dummy user into auth.users (Supabase uses this for auth)
-- Note: password is 'password123'
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@caluatnails.com',
    '$2a$10$7Z8qMvIe1.6.n.6.n.6.n.6.n.6.n.6.n.6.n.6.n.6.n.6.n.6', -- 'password123'
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin Local"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Insert into public.profiles
INSERT INTO public.profiles (id, email, name, role, created_at, last_sign_in_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@caluatnails.com',
    'Admin Local',
    'admin',
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET role = 'admin';
