SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 7lZeZIuvfISTjUI4VPttedgWzDtScvgJPS5RetuAz3nnsRedooXnXwe918Lye9R

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '427ec20a-1c72-4fcd-864f-a0090f7d0176', 'authenticated', 'authenticated', 'camilaoso112@gmail.com', '$2a$10$rlHbGg9zJ0wC6DtEijn4QekhKf/9Oy6oENXasJUIIvRxrymGf.7IK', '2026-04-05 16:40:14.022996+00', NULL, '', '2026-04-05 16:38:46.547745+00', '', NULL, '', '', NULL, '2026-04-05 16:40:14.048443+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Gloria Hernández ", "email_verified": true}', NULL, '2026-04-05 16:38:46.046656+00', '2026-04-24 11:41:03.530379+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2fa8d123-f650-43c9-a0db-5515621a8705', 'authenticated', 'authenticated', 'lydiacazallas@gmail.com', '$2a$10$PXWEk5CXpwxUxxaECPKMDez6VM6FcpxKsHP3U1rpkLYay1p4fkZJu', '2026-04-27 19:47:22.611579+00', NULL, '', '2026-04-27 19:46:55.990169+00', '', NULL, '', '', NULL, '2026-04-27 19:47:22.628968+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Lydia ", "email_verified": true}', NULL, '2026-04-27 19:46:54.574379+00', '2026-04-28 09:26:01.420575+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'authenticated', 'authenticated', 'nailoxcom@gmail.com', '$2a$10$NMWWJGyQe2TrvuExG7uU/ujKPIoqikVtxgrd44kGQGFa1RqaWgVnS', '2026-04-04 21:20:35.049051+00', NULL, '', '2026-04-04 21:20:26.503156+00', '', '2026-04-04 21:22:39.542887+00', '', '', NULL, '2026-04-30 14:04:28.396732+00', '{"provider": "email", "providers": ["email"]}', '{"name": "AdminGeneral", "email_verified": true}', NULL, '2026-04-04 21:20:25.683907+00', '2026-04-30 14:30:07.637911+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', 'authenticated', 'authenticated', 'paucami2020@gmail.com', '$2a$10$nodE/H2M5PQPw/17cagDheI3DIBUOYEcUqQ5.8245PHkP7JZb5rpe', '2026-04-13 21:00:08.730734+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-13 21:00:47.094261+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Paula Camila Osorio Hernández ", "email_verified": true}', NULL, '2026-04-13 21:00:08.69103+00', '2026-04-21 16:12:06.241974+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('427ec20a-1c72-4fcd-864f-a0090f7d0176', '427ec20a-1c72-4fcd-864f-a0090f7d0176', '{"sub": "427ec20a-1c72-4fcd-864f-a0090f7d0176", "email": "camilaoso112@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-04-05 16:38:46.093348+00', '2026-04-05 16:38:46.093432+00', '2026-04-05 16:38:46.093432+00', '8df85cfd-9705-489d-84a6-f4b72db1ade2'),
	('1fbcc848-6e00-4f8e-81ef-91d4b505c724', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '{"sub": "1fbcc848-6e00-4f8e-81ef-91d4b505c724", "email": "nailoxcom@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-04-04 21:20:25.726054+00', '2026-04-04 21:20:25.726109+00', '2026-04-04 21:20:25.726109+00', '9ee9b441-09d6-4976-9c6d-202ebb66a0f2'),
	('b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', 'b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', '{"sub": "b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0", "email": "paucami2020@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-04-13 21:00:08.721302+00', '2026-04-13 21:00:08.721363+00', '2026-04-13 21:00:08.721363+00', '12e52cdd-ddd1-4ba1-9701-e4568813977b'),
	('2fa8d123-f650-43c9-a0db-5515621a8705', '2fa8d123-f650-43c9-a0db-5515621a8705', '{"sub": "2fa8d123-f650-43c9-a0db-5515621a8705", "email": "lydiacazallas@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-04-27 19:46:54.62719+00', '2026-04-27 19:46:54.627705+00', '2026-04-27 19:46:54.627705+00', '02900e3d-4585-4594-befb-a20c58ebd14d');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('399c7d17-caf6-4e91-a724-b2b322946dd7', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:16.783036+00', '2026-04-14 11:14:16.783036+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1', '185.179.141.222', NULL, NULL, NULL, NULL, NULL),
	('ed0d9308-e75b-4fb1-be1d-5e7cc8b5bd13', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:26.879214+00', '2026-04-14 11:14:26.879214+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1', '185.179.141.222', NULL, NULL, NULL, NULL, NULL),
	('420b0c2a-b846-44a6-8b98-78f5e36fd7ea', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:27.975853+00', '2026-04-14 11:14:27.975853+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1', '185.179.141.222', NULL, NULL, NULL, NULL, NULL),
	('c3c71da6-43a6-4bf0-ba72-7e869d88a67a', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:33.732157+00', '2026-04-14 11:14:33.732157+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1', '185.179.141.222', NULL, NULL, NULL, NULL, NULL),
	('5ddcb5c0-27be-48ea-a371-873d50c54840', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:42.34577+00', '2026-04-14 11:14:42.34577+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1', '185.179.141.222', NULL, NULL, NULL, NULL, NULL),
	('80cc59bd-9ba9-4310-bd07-df4381acc7a5', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-18 18:37:47.989526+00', '2026-04-19 20:36:41.449623+00', NULL, 'aal1', NULL, '2026-04-19 20:36:41.449523', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('4d408522-280a-476e-bc1a-3c2b8987fe75', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-19 20:36:43.309943+00', '2026-04-19 20:36:43.309943+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('27c44dbc-7b87-4c05-a615-91350d68afc3', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-15 11:34:45.474588+00', '2026-04-15 11:34:45.474588+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '79.117.199.86', NULL, NULL, NULL, NULL, NULL),
	('8dd300a4-b110-4881-9bec-dc0a7fa4bff9', '427ec20a-1c72-4fcd-864f-a0090f7d0176', '2026-04-05 16:40:14.049314+00', '2026-04-24 11:41:03.534749+00', NULL, 'aal1', NULL, '2026-04-24 11:41:03.534648', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('4050382f-da43-4328-890b-f120cfe32925', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-20 20:04:20.103509+00', '2026-04-21 07:48:05.743612+00', NULL, 'aal1', NULL, '2026-04-21 07:48:05.743517', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '31.4.231.197', NULL, NULL, NULL, NULL, NULL),
	('ac891ca5-c86a-4688-9d0d-de0e6967573e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-16 15:21:35.612509+00', '2026-04-16 20:40:17.165026+00', NULL, 'aal1', NULL, '2026-04-16 20:40:17.164565', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('71ccf9d3-7695-4af3-92a5-a03a24e8c87e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-16 21:05:23.471878+00', '2026-04-17 15:23:54.111459+00', NULL, 'aal1', NULL, '2026-04-17 15:23:54.110852', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1', '79.117.199.86', NULL, NULL, NULL, NULL, NULL),
	('295c91bc-8a8b-4ad0-b427-6936541e313f', 'b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', '2026-04-13 21:00:47.098088+00', '2026-04-21 16:12:06.24979+00', NULL, 'aal1', NULL, '2026-04-21 16:12:06.24967', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('8aa34248-1474-49f0-b966-05ed480273b8', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-15 09:16:22.917942+00', '2026-04-18 11:45:53.443144+00', NULL, 'aal1', NULL, '2026-04-18 11:45:53.44305', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '79.117.199.86', NULL, NULL, NULL, NULL, NULL),
	('2da5a2dc-2f55-47bb-8a19-0f116833ee6e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-18 11:45:55.965345+00', '2026-04-18 18:37:44.898266+00', NULL, 'aal1', NULL, '2026-04-18 18:37:44.89817', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '31.4.231.134', NULL, NULL, NULL, NULL, NULL),
	('81abb2e6-b04e-46b4-a5be-7a75b761efa6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-20 15:19:38.37407+00', '2026-04-21 14:06:10.929233+00', NULL, 'aal1', NULL, '2026-04-21 14:06:10.928459', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('19192ffc-dfe5-4eb2-b783-2e4c61f0cd60', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 07:48:08.410565+00', '2026-04-21 21:03:35.801371+00', NULL, 'aal1', NULL, '2026-04-21 21:03:35.801266', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('76c9fc42-b674-406d-9291-d1f137b4cce4', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-17 15:24:52.143003+00', '2026-04-20 15:17:37.279035+00', NULL, 'aal1', NULL, '2026-04-20 15:17:37.278938', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('f5642c8a-b89f-44db-b1ce-a8391701e172', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 15:18:51.372256+00', '2026-04-21 17:50:18.033717+00', NULL, 'aal1', NULL, '2026-04-21 17:50:18.033613', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('e924a853-68ef-4d29-9966-60c58a0499bb', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-19 20:40:16.993164+00', '2026-04-20 19:53:24.101161+00', NULL, 'aal1', NULL, '2026-04-20 19:53:24.100731', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('aa0335bf-415e-4fda-83a0-6a9ea432c8b8', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-20 19:53:25.697033+00', '2026-04-20 19:53:25.697033+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('2861afa2-ac6a-4cea-93bc-79368ed24015', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 21:25:54.816453+00', '2026-04-22 09:45:54.852833+00', NULL, 'aal1', NULL, '2026-04-22 09:45:54.852237', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('8885c7dc-8edd-4633-a1df-a518d38b507f', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-20 20:04:18.840152+00', '2026-04-20 20:04:18.840152+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('7ad38049-e086-4e49-a577-6d64916310cb', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 14:21:41.95506+00', '2026-04-21 14:21:41.95506+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('cc556e85-2e78-4399-b2a9-2a8753a0c004', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:11:40.890465+00', '2026-04-22 17:11:40.890465+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('8987b310-db07-4997-96d8-bea74c05e1bd', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 21:03:37.621663+00', '2026-04-21 21:03:37.621663+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('57fa6844-84b9-4f8f-b318-925dccab83a6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 09:45:56.74187+00', '2026-04-22 09:45:56.74187+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('94fd37ea-fe50-4cc9-b38b-b16d8921b85e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-21 17:52:12.673007+00', '2026-04-22 15:41:44.335665+00', NULL, 'aal1', NULL, '2026-04-22 15:41:44.335569', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('f777e491-5686-4536-b55a-072fdb16cb6b', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 15:52:35.767732+00', '2026-04-22 16:54:00.079638+00', NULL, 'aal1', NULL, '2026-04-22 16:54:00.079518', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('1c17d31c-736e-495d-840a-8d2b84950573', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 11:14:51.952789+00', '2026-04-28 17:38:08.352471+00', NULL, 'aal1', NULL, '2026-04-28 17:38:08.352344', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '47.60.49.191', NULL, NULL, NULL, NULL, NULL),
	('0360fa17-7cfc-40bc-9f35-337539b76a32', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:07:51.963567+00', '2026-04-22 17:07:51.963567+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('ca002091-45fc-4218-adbe-11835271c145', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:15:57.424662+00', '2026-04-22 17:15:57.424662+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('5586ca08-cee8-49e3-bead-c7004575ad3f', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:18:35.733802+00', '2026-04-22 17:18:35.733802+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('8f10fbe8-d179-4e8f-adf3-2382f30ba64e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:21:15.137435+00', '2026-04-22 17:21:15.137435+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('c0f6bda4-217d-481b-a818-0ffa0320862a', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-29 16:47:41.152707+00', '2026-04-30 14:30:07.643324+00', NULL, 'aal1', NULL, '2026-04-30 14:30:07.643217', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('35a42faa-d0b9-4269-946e-f4369b55894b', '2fa8d123-f650-43c9-a0db-5515621a8705', '2026-04-27 19:47:22.629768+00', '2026-04-28 09:26:01.428319+00', NULL, 'aal1', NULL, '2026-04-28 09:26:01.428225', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36', '178.139.227.246', NULL, NULL, NULL, NULL, NULL),
	('dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-14 03:01:30.880387+00', '2026-04-28 22:32:28.713269+00', NULL, 'aal1', NULL, '2026-04-28 22:32:28.713169', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '85.251.66.183', NULL, NULL, NULL, NULL, NULL),
	('7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-22 17:33:52.360745+00', '2026-04-29 16:23:52.618058+00', NULL, 'aal1', NULL, '2026-04-29 16:23:52.617191', 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('e795a1d4-dae3-4918-ab87-1e304b478d4b', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-29 16:41:59.387238+00', '2026-04-29 16:41:59.387238+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('bbb8dd58-9614-4980-b117-6b64c1754df3', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-29 16:43:16.634272+00', '2026-04-29 16:43:16.634272+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPad; CPU OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1', '188.26.214.214', NULL, NULL, NULL, NULL, NULL),
	('8b280846-858b-40f5-b74a-61686aba250d', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', '2026-04-30 14:04:28.399681+00', '2026-04-30 14:04:28.399681+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '85.251.66.183', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('8dd300a4-b110-4881-9bec-dc0a7fa4bff9', '2026-04-05 16:40:14.072053+00', '2026-04-05 16:40:14.072053+00', 'otp', '1f5743ed-4ab7-4ba6-ad36-794b30ed17a9'),
	('295c91bc-8a8b-4ad0-b427-6936541e313f', '2026-04-13 21:00:47.14278+00', '2026-04-13 21:00:47.14278+00', 'password', '0173745c-ffb9-45a6-a396-99a4b0734db2'),
	('dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60', '2026-04-14 03:01:30.931812+00', '2026-04-14 03:01:30.931812+00', 'password', '6f1421c1-125e-47ee-87a9-fab13a363ddc'),
	('399c7d17-caf6-4e91-a724-b2b322946dd7', '2026-04-14 11:14:16.949089+00', '2026-04-14 11:14:16.949089+00', 'password', 'b67a8bc9-31e2-4361-8425-22e2b002e546'),
	('ed0d9308-e75b-4fb1-be1d-5e7cc8b5bd13', '2026-04-14 11:14:26.889548+00', '2026-04-14 11:14:26.889548+00', 'password', '88b53443-bdc1-4bc0-a6eb-4b64407728d1'),
	('420b0c2a-b846-44a6-8b98-78f5e36fd7ea', '2026-04-14 11:14:27.986027+00', '2026-04-14 11:14:27.986027+00', 'password', 'deb36778-b97a-49e1-af68-c5111b66eb03'),
	('c3c71da6-43a6-4bf0-ba72-7e869d88a67a', '2026-04-14 11:14:33.741118+00', '2026-04-14 11:14:33.741118+00', 'password', '83ba3299-1443-45c3-8277-5972b9d80aeb'),
	('5ddcb5c0-27be-48ea-a371-873d50c54840', '2026-04-14 11:14:42.353202+00', '2026-04-14 11:14:42.353202+00', 'password', 'e849f070-a7aa-4d1c-ae7f-f0d86a79eb21'),
	('1c17d31c-736e-495d-840a-8d2b84950573', '2026-04-14 11:14:51.981329+00', '2026-04-14 11:14:51.981329+00', 'password', '485f2277-c2a9-4667-88e9-33b2a4801e17'),
	('8aa34248-1474-49f0-b966-05ed480273b8', '2026-04-15 09:16:22.973444+00', '2026-04-15 09:16:22.973444+00', 'password', '4f88b798-2cf6-4d20-9552-78e6812dcbbb'),
	('27c44dbc-7b87-4c05-a615-91350d68afc3', '2026-04-15 11:34:45.527674+00', '2026-04-15 11:34:45.527674+00', 'password', 'd27577ef-1c6f-459f-a2f4-4b8898ed3a5f'),
	('ac891ca5-c86a-4688-9d0d-de0e6967573e', '2026-04-16 15:21:35.676035+00', '2026-04-16 15:21:35.676035+00', 'password', 'f96ba5c9-c59c-4457-b26f-bd5b9d148efc'),
	('71ccf9d3-7695-4af3-92a5-a03a24e8c87e', '2026-04-16 21:05:23.573251+00', '2026-04-16 21:05:23.573251+00', 'password', '20730268-5ebb-47b5-89ac-7d0a4a1c7ffe'),
	('76c9fc42-b674-406d-9291-d1f137b4cce4', '2026-04-17 15:24:52.156338+00', '2026-04-17 15:24:52.156338+00', 'password', 'c51b6229-b4b3-44f1-9cfb-eb1df0abd499'),
	('2da5a2dc-2f55-47bb-8a19-0f116833ee6e', '2026-04-18 11:45:55.981825+00', '2026-04-18 11:45:55.981825+00', 'password', '9dc261f9-b5bd-4dbd-a86b-9825628eb47f'),
	('80cc59bd-9ba9-4310-bd07-df4381acc7a5', '2026-04-18 18:37:47.996169+00', '2026-04-18 18:37:47.996169+00', 'password', '63388839-7b08-4a84-a154-ad29733ad0d9'),
	('4d408522-280a-476e-bc1a-3c2b8987fe75', '2026-04-19 20:36:43.321451+00', '2026-04-19 20:36:43.321451+00', 'password', 'dcc4168d-97d1-465c-aff4-33b23422910b'),
	('e924a853-68ef-4d29-9966-60c58a0499bb', '2026-04-19 20:40:17.044216+00', '2026-04-19 20:40:17.044216+00', 'password', '22a559d0-b7e7-47ee-9886-6ed754b821b9'),
	('81abb2e6-b04e-46b4-a5be-7a75b761efa6', '2026-04-20 15:19:38.420286+00', '2026-04-20 15:19:38.420286+00', 'password', '9879a9cb-17b6-420b-9df5-3a49efcca199'),
	('aa0335bf-415e-4fda-83a0-6a9ea432c8b8', '2026-04-20 19:53:25.708066+00', '2026-04-20 19:53:25.708066+00', 'password', '104da6ce-35b5-42c0-88da-00d7781c30be'),
	('8885c7dc-8edd-4633-a1df-a518d38b507f', '2026-04-20 20:04:18.897777+00', '2026-04-20 20:04:18.897777+00', 'password', '94b6cceb-d4df-4856-9914-8fee7bb585d7'),
	('4050382f-da43-4328-890b-f120cfe32925', '2026-04-20 20:04:20.111241+00', '2026-04-20 20:04:20.111241+00', 'password', '20157803-d639-4954-ab7c-a716132b39dc'),
	('19192ffc-dfe5-4eb2-b783-2e4c61f0cd60', '2026-04-21 07:48:08.41905+00', '2026-04-21 07:48:08.41905+00', 'password', '72b39e40-6aa1-47eb-bfc4-8c0540e9c958'),
	('7ad38049-e086-4e49-a577-6d64916310cb', '2026-04-21 14:21:42.003208+00', '2026-04-21 14:21:42.003208+00', 'password', 'b453243b-e00e-4455-a567-e16f74de3615'),
	('f5642c8a-b89f-44db-b1ce-a8391701e172', '2026-04-21 15:18:51.413798+00', '2026-04-21 15:18:51.413798+00', 'password', '725fa657-fc6d-4f0e-8bfa-810a6cbcf47d'),
	('94fd37ea-fe50-4cc9-b38b-b16d8921b85e', '2026-04-21 17:52:12.723871+00', '2026-04-21 17:52:12.723871+00', 'password', '63a7f77a-6aa6-4208-a631-2fbb27e2d1bc'),
	('8987b310-db07-4997-96d8-bea74c05e1bd', '2026-04-21 21:03:37.633688+00', '2026-04-21 21:03:37.633688+00', 'password', '8ea6492d-895f-44b6-aa92-8d51c60086c0'),
	('2861afa2-ac6a-4cea-93bc-79368ed24015', '2026-04-21 21:25:54.876511+00', '2026-04-21 21:25:54.876511+00', 'password', '284979f9-035c-4e1b-a4ce-3c12eafa5933'),
	('57fa6844-84b9-4f8f-b318-925dccab83a6', '2026-04-22 09:45:56.751647+00', '2026-04-22 09:45:56.751647+00', 'password', '1f0aa4d2-4c8e-4c02-b78c-797d6995c40c'),
	('f777e491-5686-4536-b55a-072fdb16cb6b', '2026-04-22 15:52:35.822282+00', '2026-04-22 15:52:35.822282+00', 'password', '2783229b-5a13-4e36-8894-9fcf3adf64a8'),
	('0360fa17-7cfc-40bc-9f35-337539b76a32', '2026-04-22 17:07:52.021245+00', '2026-04-22 17:07:52.021245+00', 'password', 'be3986da-a674-41c5-a819-b5364b82b118'),
	('cc556e85-2e78-4399-b2a9-2a8753a0c004', '2026-04-22 17:11:40.934579+00', '2026-04-22 17:11:40.934579+00', 'password', 'f9c5cc4a-ba4c-4748-8e33-2fb526bd62a4'),
	('ca002091-45fc-4218-adbe-11835271c145', '2026-04-22 17:15:57.464464+00', '2026-04-22 17:15:57.464464+00', 'password', 'b05f2041-5798-4cb8-9b1f-265e81524e31'),
	('5586ca08-cee8-49e3-bead-c7004575ad3f', '2026-04-22 17:18:35.773742+00', '2026-04-22 17:18:35.773742+00', 'password', '070705fa-e185-40f5-abfa-fd445b213fc0'),
	('8f10fbe8-d179-4e8f-adf3-2382f30ba64e', '2026-04-22 17:21:15.17696+00', '2026-04-22 17:21:15.17696+00', 'password', 'a4ab8af2-3bc4-45e0-9985-af86872601b6'),
	('7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d', '2026-04-22 17:33:52.420466+00', '2026-04-22 17:33:52.420466+00', 'password', 'a3320a8d-99f5-44f2-bca5-b86ed3c5f404'),
	('35a42faa-d0b9-4269-946e-f4369b55894b', '2026-04-27 19:47:22.668516+00', '2026-04-27 19:47:22.668516+00', 'otp', '600e3359-7798-4c1f-8744-cf9545c8de5e'),
	('e795a1d4-dae3-4918-ab87-1e304b478d4b', '2026-04-29 16:41:59.448493+00', '2026-04-29 16:41:59.448493+00', 'password', '7cc33112-e44a-46e6-b85d-4eea0499c76c'),
	('bbb8dd58-9614-4980-b117-6b64c1754df3', '2026-04-29 16:43:16.668318+00', '2026-04-29 16:43:16.668318+00', 'password', '41f5c271-f9a3-4a46-8e29-23cd4d00305f'),
	('c0f6bda4-217d-481b-a818-0ffa0320862a', '2026-04-29 16:47:41.193834+00', '2026-04-29 16:47:41.193834+00', 'password', '11673a38-d468-46da-9a1d-2b10248b80b5'),
	('8b280846-858b-40f5-b74a-61686aba250d', '2026-04-30 14:04:28.455733+00', '2026-04-30 14:04:28.455733+00', 'password', 'afc21725-4ff7-44d2-bcbd-6dbf7324d18b');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 201, '3tnmerq4zqop', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 17:50:18.021808+00', '2026-04-21 17:50:18.021808+00', 'dminumrdjdre', 'f5642c8a-b89f-44db-b1ce-a8391701e172'),
	('00000000-0000-0000-0000-000000000000', 161, 'mfsdtpxg3zz6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-15 12:14:22.211488+00', '2026-04-28 12:18:56.988949+00', 'er7nj334gikx', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 131, 'rcpmf5wf2rwr', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-13 20:24:25.420751+00', '2026-04-13 21:27:36.961826+00', 'jg3bsspjxcmf', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 146, '3vleklkhyalx', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 03:01:30.902841+00', '2026-04-14 03:59:53.385067+00', NULL, 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 147, 'te4ju6u5r7vp', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 03:59:53.447518+00', '2026-04-14 05:05:00.433218+00', '3vleklkhyalx', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 148, 'mcxsifoio56k', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 05:05:00.47084+00', '2026-04-14 06:33:20.121438+00', 'te4ju6u5r7vp', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 151, '63bjkzsw3s3v', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-14 11:14:16.90392+00', '2026-04-14 11:14:16.90392+00', NULL, '399c7d17-caf6-4e91-a724-b2b322946dd7'),
	('00000000-0000-0000-0000-000000000000', 152, 'n2yn54cg2vzg', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-14 11:14:26.88496+00', '2026-04-14 11:14:26.88496+00', NULL, 'ed0d9308-e75b-4fb1-be1d-5e7cc8b5bd13'),
	('00000000-0000-0000-0000-000000000000', 153, 'mjsol7xbnm64', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-14 11:14:27.982999+00', '2026-04-14 11:14:27.982999+00', NULL, '420b0c2a-b846-44a6-8b98-78f5e36fd7ea'),
	('00000000-0000-0000-0000-000000000000', 154, 'z2wjm6cjbstd', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-14 11:14:33.735496+00', '2026-04-14 11:14:33.735496+00', NULL, 'c3c71da6-43a6-4bf0-ba72-7e869d88a67a'),
	('00000000-0000-0000-0000-000000000000', 155, 'crk2p4oyi7bc', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-14 11:14:42.348871+00', '2026-04-14 11:14:42.348871+00', NULL, '5ddcb5c0-27be-48ea-a371-873d50c54840'),
	('00000000-0000-0000-0000-000000000000', 156, 'zlry2t3plnoq', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 11:14:51.969688+00', '2026-04-14 14:52:03.9948+00', NULL, '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 96, 'v3zezqd5cfxn', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-09 07:11:48.627439+00', '2026-04-13 18:31:00.287933+00', 'j4wb2bupbpn3', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 142, 'b3fzois62wvo', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-13 21:27:37.268249+00', '2026-04-14 19:54:53.728827+00', 'rcpmf5wf2rwr', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 160, 'pqfs3zqqpzcj', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-15 11:34:45.50859+00', '2026-04-15 11:34:45.50859+00', NULL, '27c44dbc-7b87-4c05-a615-91350d68afc3'),
	('00000000-0000-0000-0000-000000000000', 149, 'er7nj334gikx', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 06:33:20.136202+00', '2026-04-15 12:14:22.197319+00', 'mcxsifoio56k', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 91, '3rx2u2uxlruh', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-05 16:40:14.059062+00', '2026-04-06 16:12:02.541107+00', NULL, '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 124, 'jg3bsspjxcmf', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-13 18:31:00.315257+00', '2026-04-13 20:24:25.403213+00', 'v3zezqd5cfxn', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 157, 'ci3jxhaolb6a', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-14 14:52:04.016949+00', '2026-04-16 15:02:55.348354+00', 'zlry2t3plnoq', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 92, '6yxdgky2fb3g', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-06 16:12:02.567929+00', '2026-04-08 12:33:51.274478+00', '3rx2u2uxlruh', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 158, 'fmby5j4mks7p', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-14 19:54:53.756391+00', '2026-04-16 15:16:44.412061+00', 'b3fzois62wvo', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 94, 'j4wb2bupbpn3', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-08 12:33:51.292944+00', '2026-04-09 07:11:48.536366+00', '6yxdgky2fb3g', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 164, 'znpzipyo3yyx', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-16 15:21:35.650334+00', '2026-04-16 20:40:17.115054+00', NULL, 'ac891ca5-c86a-4688-9d0d-de0e6967573e'),
	('00000000-0000-0000-0000-000000000000', 165, 'kqurxpdsokyy', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-16 20:40:17.147537+00', '2026-04-16 20:40:17.147537+00', 'znpzipyo3yyx', 'ac891ca5-c86a-4688-9d0d-de0e6967573e'),
	('00000000-0000-0000-0000-000000000000', 166, 'ilxd7pfh5xjx', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-16 21:05:23.536848+00', '2026-04-17 15:23:54.029824+00', NULL, '71ccf9d3-7695-4af3-92a5-a03a24e8c87e'),
	('00000000-0000-0000-0000-000000000000', 167, 'xtcgat7fz2od', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-17 15:23:54.088754+00', '2026-04-17 15:23:54.088754+00', 'ilxd7pfh5xjx', '71ccf9d3-7695-4af3-92a5-a03a24e8c87e'),
	('00000000-0000-0000-0000-000000000000', 162, '6xkfvi2iq222', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-16 15:02:55.371367+00', '2026-04-17 15:26:24.252169+00', 'ci3jxhaolb6a', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 168, '5v7mcxyrqyqa', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-17 15:24:52.153973+00', '2026-04-17 16:24:29.115266+00', NULL, '76c9fc42-b674-406d-9291-d1f137b4cce4'),
	('00000000-0000-0000-0000-000000000000', 163, 'c7mrzilfbw4l', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-16 15:16:44.439227+00', '2026-04-18 11:45:30.749489+00', 'fmby5j4mks7p', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 159, 'hlijy35nz4yx', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-15 09:16:22.944815+00', '2026-04-18 11:45:53.420274+00', NULL, '8aa34248-1474-49f0-b966-05ed480273b8'),
	('00000000-0000-0000-0000-000000000000', 172, 'wxxk7qzhp4l6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-18 11:45:53.430703+00', '2026-04-18 11:45:53.430703+00', 'hlijy35nz4yx', '8aa34248-1474-49f0-b966-05ed480273b8'),
	('00000000-0000-0000-0000-000000000000', 173, 'zntn4yb2qnkv', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-18 11:45:55.980377+00', '2026-04-18 18:37:44.859359+00', NULL, '2da5a2dc-2f55-47bb-8a19-0f116833ee6e'),
	('00000000-0000-0000-0000-000000000000', 174, 'h5zpigvaslli', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-18 18:37:44.881758+00', '2026-04-18 18:37:44.881758+00', 'zntn4yb2qnkv', '2da5a2dc-2f55-47bb-8a19-0f116833ee6e'),
	('00000000-0000-0000-0000-000000000000', 171, 'ems3x3iqu33f', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-18 11:45:30.767222+00', '2026-04-19 18:00:24.912375+00', 'c7mrzilfbw4l', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 175, '6c4nngspafrh', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-18 18:37:47.99399+00', '2026-04-19 20:36:41.403361+00', NULL, '80cc59bd-9ba9-4310-bd07-df4381acc7a5'),
	('00000000-0000-0000-0000-000000000000', 177, 'gnircmuxp5e7', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-19 20:36:41.427711+00', '2026-04-19 20:36:41.427711+00', '6c4nngspafrh', '80cc59bd-9ba9-4310-bd07-df4381acc7a5'),
	('00000000-0000-0000-0000-000000000000', 178, 'ulztndyvzvjf', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-19 20:36:43.319826+00', '2026-04-19 20:36:43.319826+00', NULL, '4d408522-280a-476e-bc1a-3c2b8987fe75'),
	('00000000-0000-0000-0000-000000000000', 169, 'sflnjnm5wzwp', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-17 15:26:24.258991+00', '2026-04-20 07:06:40.031527+00', '6xkfvi2iq222', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 180, 'ppygwqhkdtj4', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 07:06:40.056203+00', '2026-04-20 08:51:53.84213+00', 'sflnjnm5wzwp', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 181, 'cqvtdkppiajg', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 08:51:53.856808+00', '2026-04-20 11:35:08.886837+00', 'ppygwqhkdtj4', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 170, 'zffmyvg6krwt', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-17 16:24:29.142048+00', '2026-04-20 15:17:37.24343+00', '5v7mcxyrqyqa', '76c9fc42-b674-406d-9291-d1f137b4cce4'),
	('00000000-0000-0000-0000-000000000000', 183, 'kaezqdkapwic', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-20 15:17:37.264602+00', '2026-04-20 15:17:37.264602+00', 'zffmyvg6krwt', '76c9fc42-b674-406d-9291-d1f137b4cce4'),
	('00000000-0000-0000-0000-000000000000', 184, 'regxcnhtwnub', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 15:19:38.396448+00', '2026-04-20 16:32:15.374296+00', NULL, '81abb2e6-b04e-46b4-a5be-7a75b761efa6'),
	('00000000-0000-0000-0000-000000000000', 179, '6bxy6vpbdtkv', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-19 20:40:17.021492+00', '2026-04-20 19:53:24.063887+00', NULL, 'e924a853-68ef-4d29-9966-60c58a0499bb'),
	('00000000-0000-0000-0000-000000000000', 186, 'lpogjz745vaj', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-20 19:53:24.082949+00', '2026-04-20 19:53:24.082949+00', '6bxy6vpbdtkv', 'e924a853-68ef-4d29-9966-60c58a0499bb'),
	('00000000-0000-0000-0000-000000000000', 187, 'uahjq74kgtox', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-20 19:53:25.706653+00', '2026-04-20 19:53:25.706653+00', NULL, 'aa0335bf-415e-4fda-83a0-6a9ea432c8b8'),
	('00000000-0000-0000-0000-000000000000', 176, 'jd5vkwdrsbzc', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-19 18:00:24.938308+00', '2026-04-20 20:00:10.633943+00', 'ems3x3iqu33f', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 189, 'c47yqhezpynm', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-20 20:04:18.868107+00', '2026-04-20 20:04:18.868107+00', NULL, '8885c7dc-8edd-4633-a1df-a518d38b507f'),
	('00000000-0000-0000-0000-000000000000', 185, 's3pikek5kq3t', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 16:32:15.399842+00', '2026-04-21 08:14:40.929225+00', 'regxcnhtwnub', '81abb2e6-b04e-46b4-a5be-7a75b761efa6'),
	('00000000-0000-0000-0000-000000000000', 188, 'vwsdqq4zs5xg', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-20 20:00:10.749264+00', '2026-04-21 15:54:28.447312+00', 'jd5vkwdrsbzc', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 141, 'msdma2kojhmk', 'b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', true, '2026-04-13 21:00:47.124388+00', '2026-04-21 16:12:06.170494+00', NULL, '295c91bc-8a8b-4ad0-b427-6936541e313f'),
	('00000000-0000-0000-0000-000000000000', 200, 'dminumrdjdre', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 16:51:46.34173+00', '2026-04-21 17:50:18.007561+00', 'hlop25rpp3ra', 'f5642c8a-b89f-44db-b1ce-a8391701e172'),
	('00000000-0000-0000-0000-000000000000', 190, 'ozasoxu47f35', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 20:04:20.105455+00', '2026-04-21 07:48:05.709101+00', NULL, '4050382f-da43-4328-890b-f120cfe32925'),
	('00000000-0000-0000-0000-000000000000', 191, 'qkptlu5vawxt', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 07:48:05.731048+00', '2026-04-21 07:48:05.731048+00', 'ozasoxu47f35', '4050382f-da43-4328-890b-f120cfe32925'),
	('00000000-0000-0000-0000-000000000000', 182, 'tdwo66a5ayqf', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-20 11:35:08.904337+00', '2026-04-21 17:51:37.822257+00', 'cqvtdkppiajg', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 193, 'obdxhcx25s4y', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 08:14:40.947321+00', '2026-04-21 10:13:47.663917+00', 's3pikek5kq3t', '81abb2e6-b04e-46b4-a5be-7a75b761efa6'),
	('00000000-0000-0000-0000-000000000000', 194, 'czlqu3rbw4xs', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 10:13:47.67391+00', '2026-04-21 14:06:10.794032+00', 'obdxhcx25s4y', '81abb2e6-b04e-46b4-a5be-7a75b761efa6'),
	('00000000-0000-0000-0000-000000000000', 195, 'ptxz4ht4bl6j', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 14:06:10.910728+00', '2026-04-21 14:06:10.910728+00', 'czlqu3rbw4xs', '81abb2e6-b04e-46b4-a5be-7a75b761efa6'),
	('00000000-0000-0000-0000-000000000000', 196, 'cdldy2gg24dv', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 14:21:41.982488+00', '2026-04-21 14:21:41.982488+00', NULL, '7ad38049-e086-4e49-a577-6d64916310cb'),
	('00000000-0000-0000-0000-000000000000', 199, 'cywirioqulso', 'b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', false, '2026-04-21 16:12:06.225665+00', '2026-04-21 16:12:06.225665+00', 'msdma2kojhmk', '295c91bc-8a8b-4ad0-b427-6936541e313f'),
	('00000000-0000-0000-0000-000000000000', 197, 'hlop25rpp3ra', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 15:18:51.397546+00', '2026-04-21 16:51:46.326289+00', NULL, 'f5642c8a-b89f-44db-b1ce-a8391701e172'),
	('00000000-0000-0000-0000-000000000000', 202, 'oygdcd7hfljo', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 17:51:37.838259+00', '2026-04-21 19:03:09.879747+00', 'tdwo66a5ayqf', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 192, 'qn424zktizrp', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 07:48:08.417495+00', '2026-04-21 21:03:35.764695+00', NULL, '19192ffc-dfe5-4eb2-b783-2e4c61f0cd60'),
	('00000000-0000-0000-0000-000000000000', 205, 'rrxxbamjyxqu', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 21:03:35.782291+00', '2026-04-21 21:03:35.782291+00', 'qn424zktizrp', '19192ffc-dfe5-4eb2-b783-2e4c61f0cd60'),
	('00000000-0000-0000-0000-000000000000', 206, 'l2cnbz2medkr', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-21 21:03:37.63212+00', '2026-04-21 21:03:37.63212+00', NULL, '8987b310-db07-4997-96d8-bea74c05e1bd'),
	('00000000-0000-0000-0000-000000000000', 207, '64c32u27jhd3', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 21:25:54.846591+00', '2026-04-22 09:45:54.816404+00', NULL, '2861afa2-ac6a-4cea-93bc-79368ed24015'),
	('00000000-0000-0000-0000-000000000000', 208, 'uerdbxevbiyd', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 09:45:54.837827+00', '2026-04-22 09:45:54.837827+00', '64c32u27jhd3', '2861afa2-ac6a-4cea-93bc-79368ed24015'),
	('00000000-0000-0000-0000-000000000000', 209, '4nnp3cw2ghiv', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 09:45:56.749881+00', '2026-04-22 09:45:56.749881+00', NULL, '57fa6844-84b9-4f8f-b318-925dccab83a6'),
	('00000000-0000-0000-0000-000000000000', 203, 'ta7rb5wwvud7', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 17:52:12.70494+00', '2026-04-22 15:41:44.301011+00', NULL, '94fd37ea-fe50-4cc9-b38b-b16d8921b85e'),
	('00000000-0000-0000-0000-000000000000', 210, 'dc6zlmjk5jgh', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 15:41:44.318422+00', '2026-04-22 15:41:44.318422+00', 'ta7rb5wwvud7', '94fd37ea-fe50-4cc9-b38b-b16d8921b85e'),
	('00000000-0000-0000-0000-000000000000', 211, '4cbjdzmjnpyd', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-22 15:52:35.801025+00', '2026-04-22 16:54:00.043599+00', NULL, 'f777e491-5686-4536-b55a-072fdb16cb6b'),
	('00000000-0000-0000-0000-000000000000', 212, 'phhvftpo25qz', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 16:54:00.065409+00', '2026-04-22 16:54:00.065409+00', '4cbjdzmjnpyd', 'f777e491-5686-4536-b55a-072fdb16cb6b'),
	('00000000-0000-0000-0000-000000000000', 198, 'p7jf5taw2dqm', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-21 15:54:28.552222+00', '2026-04-22 16:58:06.331645+00', 'vwsdqq4zs5xg', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 214, 'rsxdh3hoc4mk', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 17:07:51.996162+00', '2026-04-22 17:07:51.996162+00', NULL, '0360fa17-7cfc-40bc-9f35-337539b76a32'),
	('00000000-0000-0000-0000-000000000000', 215, 'rlklmv7opc4y', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 17:11:40.91667+00', '2026-04-22 17:11:40.91667+00', NULL, 'cc556e85-2e78-4399-b2a9-2a8753a0c004'),
	('00000000-0000-0000-0000-000000000000', 216, 'e4vr4piista6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 17:15:57.448966+00', '2026-04-22 17:15:57.448966+00', NULL, 'ca002091-45fc-4218-adbe-11835271c145'),
	('00000000-0000-0000-0000-000000000000', 217, 'rlcx4fvpchtc', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 17:18:35.757517+00', '2026-04-22 17:18:35.757517+00', NULL, '5586ca08-cee8-49e3-bead-c7004575ad3f'),
	('00000000-0000-0000-0000-000000000000', 218, 'oyuxltsngzju', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-22 17:21:15.164209+00', '2026-04-22 17:21:15.164209+00', NULL, '8f10fbe8-d179-4e8f-adf3-2382f30ba64e'),
	('00000000-0000-0000-0000-000000000000', 219, 'dlnevnzfusg7', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-22 17:33:52.398057+00', '2026-04-24 09:16:38.19186+00', NULL, '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 213, '3ekj5chsytql', '427ec20a-1c72-4fcd-864f-a0090f7d0176', true, '2026-04-22 16:58:06.348467+00', '2026-04-24 11:41:03.503807+00', 'p7jf5taw2dqm', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 221, 'cmefikobcf32', '427ec20a-1c72-4fcd-864f-a0090f7d0176', false, '2026-04-24 11:41:03.520222+00', '2026-04-24 11:41:03.520222+00', '3ekj5chsytql', '8dd300a4-b110-4881-9bec-dc0a7fa4bff9'),
	('00000000-0000-0000-0000-000000000000', 220, 'fahmwv4tjqeo', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-24 09:16:38.209783+00', '2026-04-24 13:48:55.084948+00', 'dlnevnzfusg7', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 222, 'ca6g6l7k74pv', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-24 13:48:55.107745+00', '2026-04-24 14:47:25.842868+00', 'fahmwv4tjqeo', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 223, '47ie6vhbzm6v', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-24 14:47:25.858391+00', '2026-04-24 15:46:04.025768+00', 'ca6g6l7k74pv', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 224, 'pcmnu5fisyfo', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-24 15:46:04.054668+00', '2026-04-24 16:45:50.649308+00', '47ie6vhbzm6v', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 204, 'co34m7wkj5ae', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-21 19:03:09.89766+00', '2026-04-25 12:08:07.785315+00', 'oygdcd7hfljo', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 226, 't7sj5hjfvj3u', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-25 12:08:07.804018+00', '2026-04-25 13:33:53.771771+00', 'co34m7wkj5ae', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 227, 'irphzpekjbjf', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-25 13:33:53.79186+00', '2026-04-27 07:41:41.474033+00', 't7sj5hjfvj3u', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 228, 'f4brbemxgduj', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-27 07:41:41.500954+00', '2026-04-27 09:14:15.768812+00', 'irphzpekjbjf', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 225, 'zeiptalfx2tc', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-24 16:45:50.667662+00', '2026-04-27 11:00:26.607673+00', 'pcmnu5fisyfo', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 230, 'qw5q42u6qs5d', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-27 11:00:26.623228+00', '2026-04-27 12:08:51.830153+00', 'zeiptalfx2tc', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 231, '4jledebrxw2w', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-27 12:08:51.866932+00', '2026-04-27 16:24:25.068538+00', 'qw5q42u6qs5d', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 233, 'gezwhwot6id7', '2fa8d123-f650-43c9-a0db-5515621a8705', true, '2026-04-27 19:47:22.649825+00', '2026-04-27 21:18:30.807032+00', NULL, '35a42faa-d0b9-4269-946e-f4369b55894b'),
	('00000000-0000-0000-0000-000000000000', 229, 'jcq67kkcdyig', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-27 09:14:15.787333+00', '2026-04-28 07:00:34.510226+00', 'f4brbemxgduj', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 234, 'q4fqe5kxqfod', '2fa8d123-f650-43c9-a0db-5515621a8705', true, '2026-04-27 21:18:30.8246+00', '2026-04-28 09:26:01.368993+00', 'gezwhwot6id7', '35a42faa-d0b9-4269-946e-f4369b55894b'),
	('00000000-0000-0000-0000-000000000000', 236, 'euuy3go3hbpm', '2fa8d123-f650-43c9-a0db-5515621a8705', false, '2026-04-28 09:26:01.398289+00', '2026-04-28 09:26:01.398289+00', 'q4fqe5kxqfod', '35a42faa-d0b9-4269-946e-f4369b55894b'),
	('00000000-0000-0000-0000-000000000000', 232, 'hd7ntfwbhkfk', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-27 16:24:25.085592+00', '2026-04-28 12:53:25.049126+00', '4jledebrxw2w', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 238, 'jwe4froo5guw', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-28 12:53:25.07055+00', '2026-04-28 13:52:00.8158+00', 'hd7ntfwbhkfk', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 235, 'u3277pxaolqe', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-28 07:00:34.535344+00', '2026-04-28 17:38:08.323481+00', 'jcq67kkcdyig', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 240, '5cmhj4pnkvi5', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-28 17:38:08.338077+00', '2026-04-28 17:38:08.338077+00', 'u3277pxaolqe', '1c17d31c-736e-495d-840a-8d2b84950573'),
	('00000000-0000-0000-0000-000000000000', 239, 'vqyfjlpanx67', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-28 13:52:00.836607+00', '2026-04-28 18:57:25.343013+00', 'jwe4froo5guw', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 237, 'uzh5digl4luk', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-28 12:18:57.00386+00', '2026-04-28 22:32:28.663552+00', 'mfsdtpxg3zz6', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 242, 'erljm25clu4j', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-28 22:32:28.694433+00', '2026-04-28 22:32:28.694433+00', 'uzh5digl4luk', 'dc3f6577-b7b5-4e9f-87ef-e10ecf6aec60'),
	('00000000-0000-0000-0000-000000000000', 241, 'm6q7rcgjuf53', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-28 18:57:25.353412+00', '2026-04-29 10:06:29.490642+00', 'vqyfjlpanx67', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 243, 'qzh4dsuoxre3', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-29 10:06:29.509589+00', '2026-04-29 13:46:30.121181+00', 'm6q7rcgjuf53', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 244, 'gavmfqf4rutw', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-29 13:46:30.139244+00', '2026-04-29 16:23:52.5727+00', 'qzh4dsuoxre3', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 245, '6f2gszzwyb2g', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-29 16:23:52.592664+00', '2026-04-29 16:23:52.592664+00', 'gavmfqf4rutw', '7bc88ae1-e8cd-4b8e-ae55-053fd7bf7b4d'),
	('00000000-0000-0000-0000-000000000000', 246, 'dafyd6v3jad5', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-29 16:41:59.421857+00', '2026-04-29 16:41:59.421857+00', NULL, 'e795a1d4-dae3-4918-ab87-1e304b478d4b'),
	('00000000-0000-0000-0000-000000000000', 247, '5ao6tioeqooi', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-29 16:43:16.652465+00', '2026-04-29 16:43:16.652465+00', NULL, 'bbb8dd58-9614-4980-b117-6b64c1754df3'),
	('00000000-0000-0000-0000-000000000000', 248, 'ewn3qodna2bq', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-29 16:47:41.176703+00', '2026-04-30 09:05:26.307199+00', NULL, 'c0f6bda4-217d-481b-a818-0ffa0320862a'),
	('00000000-0000-0000-0000-000000000000', 249, 'qbgcucsirlzn', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-30 09:05:26.327645+00', '2026-04-30 10:09:15.150204+00', 'ewn3qodna2bq', 'c0f6bda4-217d-481b-a818-0ffa0320862a'),
	('00000000-0000-0000-0000-000000000000', 250, 'lecbh2bgs6i4', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-30 10:09:15.162891+00', '2026-04-30 13:25:20.635154+00', 'qbgcucsirlzn', 'c0f6bda4-217d-481b-a818-0ffa0320862a'),
	('00000000-0000-0000-0000-000000000000', 252, 'eea4arooypix', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-30 14:04:28.425092+00', '2026-04-30 14:04:28.425092+00', NULL, '8b280846-858b-40f5-b74a-61686aba250d'),
	('00000000-0000-0000-0000-000000000000', 251, '6ztdkcgmz5dl', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', true, '2026-04-30 13:25:20.650057+00', '2026-04-30 14:30:07.605852+00', 'lecbh2bgs6i4', 'c0f6bda4-217d-481b-a818-0ffa0320862a'),
	('00000000-0000-0000-0000-000000000000', 253, 'qhns5r3vl3np', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', false, '2026-04-30 14:30:07.630744+00', '2026-04-30 14:30:07.630744+00', '6ztdkcgmz5dl', 'c0f6bda4-217d-481b-a818-0ffa0320862a');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "name", "avatar_url", "created_at", "last_sign_in_at", "role", "points", "course_completed", "is_professional", "referral_code", "course_access", "signup_source") VALUES
	('427ec20a-1c72-4fcd-864f-a0090f7d0176', 'camilaoso112@gmail.com', 'Gloria Hernández ', NULL, '2026-04-05 16:38:46.046311+00', '2026-04-05 16:38:46.046311+00', 'admin', 0, false, false, 'NAILOX-427EC20A', false, 'manual'),
	('b6a3f1ca-8f90-4826-b9db-bb2fb1fdf7d0', 'paucami2020@gmail.com', 'Paula Camila Osorio Hernández ', NULL, '2026-04-13 21:00:08.689011+00', '2026-04-13 21:00:08.689011+00', 'student', 130, false, false, 'NAILOX-B6A3F1CA', false, 'booking'),
	('1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'nailoxcom@gmail.com', 'Gloria Hernández', NULL, '2026-04-04 21:20:25.683484+00', '2026-04-04 21:20:25.683484+00', 'admin', 390, false, false, 'NAILOX-1FBCC848', false, 'manual'),
	('2fa8d123-f650-43c9-a0db-5515621a8705', 'lydiacazallas@gmail.com', 'Lydia ', NULL, '2026-04-27 19:46:54.571893+00', '2026-04-27 19:46:54.571893+00', 'student', 0, false, false, NULL, false, 'manual');


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bookings" ("id", "user_id", "client_name", "client_email", "client_phone", "booking_date", "booking_time", "total_duration_minutes", "total_price", "deposit_amount", "deposit_paid", "stripe_session_id", "status", "notes", "created_at", "updated_at", "professional_id", "google_event_id", "payment_method") VALUES
	('3598f8d1-27ff-42fb-921a-0f97c96ad389', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Rosa cerrano', 'nailoxcom@gmail.com', '665630455', '2026-04-18', '12:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-16 21:21:44.955748+00', '2026-04-20 15:26:37.458+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('753338e0-104c-42cf-9202-0e340655864c', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Mafe', 'nailoxcom@gmail.com', '664479324', '2026-04-20', '10:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-16 21:30:47.96261+00', '2026-04-17 15:26:55.205+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('f686e9b0-629f-449c-ad1f-6fe42760dac2', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Dorty', 'nailoxcom@gmail.com', '611760764', '2026-04-17', '19:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-16 21:19:33.996076+00', '2026-04-20 15:26:42.976+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('cc7d12b1-8b2e-462e-b979-51ce2ca79025', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Irina', 'nailoxcom@gmail.com', '608381568', '2026-04-17', '17:00', 120, 55.00, 5.50, false, NULL, 'confirmed', NULL, '2026-04-16 21:12:23.105255+00', '2026-04-20 15:26:48.86+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('bfe546a0-9c92-483f-870d-118359a5ce37', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Doris Rodríguez ', 'nailoxcom@gmail.com', '620435521', '2026-04-17', '10:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-16 21:01:32.892951+00', '2026-04-17 15:27:23.338+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('13d177c0-3daf-4241-9aaa-b6d493fec260', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Lene', 'nailoxcom@gmail.com', '722155405', '2026-04-17', '15:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-16 21:10:03.706739+00', '2026-04-20 15:26:52.729+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('2d3f60b1-bd82-4693-a9f6-d9ecf52a3aa3', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Genesis victoria ', 'nailoxcom@gmail.com', '624769194', '2026-04-17', '13:00', 60, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-16 21:08:05.162787+00', '2026-04-20 15:26:55.498+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('2720f193-6f2d-49f5-ac81-0ce34386512f', '427ec20a-1c72-4fcd-864f-a0090f7d0176', 'Daniela Geni', 'nailoxcom@gmail.com', '630 44 74 47', '2026-04-22', '12:00', 90, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-20 20:03:39.401196+00', '2026-04-20 20:04:28.206+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('a30632dd-95f1-45eb-8787-47ee15309da1', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Ana grau', 'nailoxcom@gmail.com', '696239823', '2026-04-21', '18:30', 60, 32.00, 3.20, false, NULL, 'cancelled', NULL, '2026-04-16 21:36:26.318773+00', '2026-04-17 15:28:48.081+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('25b7ffff-dbaf-47ff-b123-71e6027b51b9', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '636689101', '2026-04-22', '17:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:34:14.5618+00', '2026-04-17 15:34:57.94+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('d17a096b-765c-4f50-bb97-30bcc8acc1bf', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '636689101', '2026-04-22', '17:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:33:25.29608+00', '2026-04-17 15:35:03.211+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('1a1d5769-4f91-4b5c-9d0c-6ee5f7bc3773', NULL, 'Génesis Victori ', 'gbhvictori2@gmail.com', '624769194', '2026-04-16', '17:30', 60, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-16 14:30:30.784546+00', '2026-04-16 15:27:37.852+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('4ed8ca66-4dfe-4c9f-84bd-7f4c5a5a41e5', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Levi ', 'nailoxcom@gmail.com', ' 636 68 91 01', '2026-04-30', '14:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:48:49.898657+00', '2026-04-20 15:44:04.354+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('f9708bd2-a498-48aa-b3f5-fb10439afc19', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '636 68 91 01', '2026-04-22', '17:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:36:41.193124+00', '2026-04-17 15:49:08.661+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('211c1d50-f6e0-449b-8a76-37824ebcdca2', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Levi ', 'nailoxcom@gmail.com', '636 68 91 01', '2026-04-30', '17:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:44:09.018928+00', '2026-04-17 15:49:20.226+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('99050941-b2f6-4578-aac9-f46b2140182b', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Kelly', 'nailoxcom@gmail.com', '658607640', '2026-04-20', '10:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-16 21:28:22.044921+00', '2026-04-18 18:38:11.823+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('b9439f47-2104-437b-9b10-1a13cc653307', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Ana Grau ', 'nailoxcom@gmail.com', '636 68 91 01', '2026-04-22', '17:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-17 15:51:09.708616+00', '2026-04-19 20:39:26+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('8a45603c-c450-47a7-b752-53f1929d0b25', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Alejandra Diaz', 'nailoxcom@gmail.com', '678438715', '2026-04-21', '10:00', 90, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:30:03.687271+00', '2026-04-20 15:35:00.51+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('c138fafc-2a38-4e9f-b316-d951fe030168', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Alejandra Medina', 'nailoxcom@gmail.com', '666648289', '2026-04-21', '12:00', 60, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:31:36.565532+00', '2026-04-20 15:35:08.328+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('2344d556-38fb-4592-b670-87e2ba6f9f14', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Alessandra Valle', 'nailoxcom@gmail.com', '631115494', '2026-04-21', '16:00', 90, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:32:56.864638+00', '2026-04-20 15:35:17.51+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('cff4bfa0-852e-4963-8015-016d89b66580', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Rossa ', 'nailoxcom@gmail.com', '664627242', '2026-04-24', '14:00', 120, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-21 14:57:54.516581+00', '2026-04-21 14:59:05.955+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('6f83fc96-96c6-42ed-be72-929bde4d784b', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Lene ', 'nailoxcom@gmail.com', '636 68 91 01', '2026-05-29', '15:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 16:35:24.393278+00', '2026-04-20 15:47:14.579+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('5f88eabf-4923-4c75-b9bd-56d0af43b8a2', NULL, 'Rossana', 'nailoxcom@gmail.com', '649248079', '2026-04-22', '09:00', 120, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:38:17.287932+00', '2026-04-20 15:48:33.656+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('17aa58b1-01c5-4938-bc65-2f076083a9c1', NULL, 'Gersi Trujillo', 'nailoxcom@gmail.com', '617596581', '2026-04-23', '15:00', 120, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:42:31.976975+00', '2026-04-20 15:48:45.24+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('903a4a03-0fa3-4780-9c87-4fbf8cdce0db', NULL, 'Gersi Trujillo', 'nailoxcom@gmail.com', '617596581', '2026-04-23', '17:00', 120, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:42:59.269593+00', '2026-04-20 15:48:47.215+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('485b9c4e-ace1-4b3b-bcf5-04c5ad9d2df0', NULL, 'Leivi', 'nailoxcom@gmail.com', '618829201', '2026-04-30', '17:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-20 15:45:32.100921+00', '2026-04-20 15:48:54.635+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('cd4625e5-75c6-4eda-b8ee-c183f810e8f0', NULL, 'Lene', 'nailoxcom@gmail.com', '722155405', '2026-05-28', '15:00', 120, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-20 15:48:03.369016+00', '2026-04-20 15:49:29.26+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('bca45d8b-6e7f-4c92-b3b3-7de8f9e53641', NULL, 'Lenny ', 'nailoxcom@ gmail.com', '634 95 69 17', '2026-04-24', '16:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-22 15:54:53.814832+00', '2026-04-24 16:16:14.199+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('4e6669b4-65e9-4ed3-a286-07cf340c5471', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Laura Sancho', 'nailoxcom@gmail.com', '636 68 91 01', '2026-04-29', '18:30', 60, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-17 15:53:47.124099+00', '2026-04-21 15:13:03.988+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('5e302d2f-b7fc-4cee-9de1-295c09ea29a2', NULL, 'Ana Perez', 'nailoxcom@gmail.com', '677777730', '2026-04-24', '13:00', 60, 32.00, 3.20, false, NULL, 'cancelled', NULL, '2026-04-20 15:50:45.92149+00', '2026-04-24 15:48:23.176+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('af643ff9-8d55-40c2-9527-623f07b2e47f', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Laura sancho', 'nailoxcom@gmail.com', '664233757', '2026-04-21', '18:30', 60, 32.00, 3.20, false, NULL, 'cancelled', NULL, '2026-04-16 21:34:14.802195+00', '2026-04-21 15:15:10.99+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('51149acf-70e6-42f4-89b0-27a813aa4710', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Laura Sancho ', 'nailoxcom@gmail.com', '664 23 37 57', '2026-04-29', '18:30', 60, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-21 15:17:18.688466+00', '2026-04-21 15:19:19.792+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('cd8f4fb3-dad1-411a-b9f4-a15e430626cc', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '664 23 37 57', '2026-04-22', '19:30', 60, 32.00, 3.20, false, NULL, 'confirmed', NULL, '2026-04-21 15:14:40.984062+00', '2026-04-21 15:19:35.261+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('dac9bd0c-4895-4f8e-aa12-a7700b395b58', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'EVELYN ', 'nailoxcom@gmail.com', '678 89 06 11', '2026-05-12', '19:00', 60, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-21 17:55:25.888644+00', '2026-04-21 17:55:39.855+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('5f8e9a53-b1e7-4fbd-931e-0fdaef444c6e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '678 89 06 11', '2026-05-12', '19:00', 60, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-21 17:54:28.215709+00', '2026-04-21 17:55:36.585+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('94a67598-8ca5-433b-bced-125d556403b6', NULL, 'Rossana ', 'rossana_rotela@hotmail.es', '+34649248079', '2026-05-19', '09:00', 180, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-22 10:18:33.791557+00', '2026-04-22 15:47:21.572+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('e8ad2ae9-990f-4d88-89e4-d5a6d6a78641', NULL, 'Sharay Victoria', 'victoria.svmp@gmail.com', '+584142924860', '2026-04-22', '13:30', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-21 21:58:22.742463+00', '2026-04-22 15:47:26.025+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('441715e4-3b0f-4f33-885f-24e198e5725b', NULL, 'Zakia mañañe ', 'zakia@libreriadelibros.es', '697726566', '2026-04-23', '11:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-22 07:29:06.905411+00', '2026-04-22 15:48:21.048+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('22dff7d3-aea3-4a0a-95bb-880da9bd5c78', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'AdminGeneral', 'nailoxcom@gmail.com', '634 95 69 17', '2026-04-24', '18:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-22 15:46:26.853648+00', '2026-04-22 15:48:56.076+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('ac5e9b06-3d69-4b2a-b92e-6f688411c94e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Ednara', 'nailoxcom@gmail.com', '636 68 91 01', '2026-05-02', '11:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-17 15:59:07.126882+00', '2026-04-30 14:00:55.606+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('7af86473-a96a-4ca7-8f2a-c547a0259caa', NULL, 'Dayana Morales ', 'nailoxcom@ gmail.com', '696 35 72 35', '2026-04-27', '11:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-22 16:48:23.599392+00', '2026-04-22 16:49:36.964+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('877bec94-abf9-458d-abbc-e2006d7b5a12', NULL, 'HERMANA DE GERSI ', 'nailoxcom@ gmail.com', '610 66 92 13', '2026-04-28', '10:00', 120, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-22 17:03:03.786757+00', '2026-04-28 13:37:28.93+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('6d329d23-d319-4f92-bb6c-a5d4220ebb02', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Laura Sancho ', 'nailoxcom@gmail.com', '664 23 37 57', '2026-04-29', '18:30', 60, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-21 15:16:13.730327+00', '2026-04-22 17:25:19.439+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('e676ca49-139b-40d4-b1e3-7072f3a49cd6', NULL, 'Laura Sancho ', 'nailoxcom@gmail.com', '664 23 37 57', '2026-04-27', '18:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-22 17:28:15.874007+00', '2026-04-22 17:29:09.204+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('f090e972-a75a-48f5-a3c9-39b094f5f840', NULL, 'Anna Grau', 'annagrau2024@gmail.com', '696239823', '2026-05-12', '17:00', 90, 50.00, 5.00, false, NULL, 'confirmed', NULL, '2026-04-23 08:41:44.421796+00', '2026-04-24 14:40:08.785+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('617c3898-abaa-4da1-8062-44e487f70da1', NULL, 'Angie Medina ', 'nailoxcom@gmail.com', '617 68 60 78', '2026-05-05', '10:00', 120, 55.00, 5.50, false, NULL, 'confirmed', NULL, '2026-04-27 11:17:59.705412+00', '2026-04-27 11:18:38.868+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('b292eccb-562d-4466-8f64-4fd2d5826287', NULL, 'BRENDA', 'nailoxcom@gmail.com', '633 50 34 36', '2026-05-13', '17:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-24 14:43:41.009365+00', '2026-04-24 14:48:53.19+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('76a65e69-1ddc-4d31-9899-bf3ea1c82520', NULL, 'ALEX ', 'nailoxcom@gmail.com', '747 74 87 41', '2026-04-29', '11:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-24 14:47:05.604149+00', '2026-04-24 14:49:11.63+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('af7ba25f-ebe1-419d-aa40-6876af1dee43', NULL, 'HERMANA DE GERSI', 'nailoxcom@gmail.com', '610 66 92 13', '2026-04-29', '11:30', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-28 13:41:40.141649+00', '2026-04-28 13:41:54.196+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('ec466a45-fd82-431a-b2ad-6ffe06fde374', NULL, 'LILIT', 'nailoxcom@gmail.com', '+7 903 179-66-22', '2026-04-30', '14:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-24 15:54:21.520844+00', '2026-04-24 15:54:44.094+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('f84d65d2-4066-4492-b67d-076ca0fb0709', NULL, 'MARTA ELINA', 'nailoxcom@ gmail.com', '638 96 74 19', '2026-04-25', '11:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-24 16:01:29.723515+00', '2026-04-24 16:01:47.288+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('c9fc0d52-3169-462d-bae2-169f016c7cf9', NULL, 'BRENDA', 'nailoxcom@gmail.com', '633 50 34 36', '2026-05-13', '17:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-24 14:43:01.700563+00', '2026-04-24 16:04:52.556+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('3f93af78-e930-495a-ab5d-6a05d027fb78', NULL, 'CRISTINA ', 'nailoxcom@ gmail.com', '664 56 98 86', '2026-04-25', '09:00', 60, 30.00, 3.00, false, NULL, 'confirmed', NULL, '2026-04-24 16:13:08.688883+00', '2026-04-24 16:13:25.822+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('8b297a22-9d93-4860-b6c3-e3daf774227b', NULL, 'LENNY ESPA ', 'nailoxcom@gmail.com', '634 95 69 17', '2026-04-27', '16:00', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-27 11:38:42.589931+00', '2026-04-27 11:39:49.646+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('94b1a346-0904-4479-8d61-79eeed71e8a6', NULL, 'LENNY ESPA ', 'nailoxcom@gmail.com', '634 95 69 17', '2026-04-27', '16:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-27 11:39:25.238795+00', '2026-04-27 11:39:50.945+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('5c4d5a8f-a1e4-479a-b305-40b14b409872', NULL, 'Adriana nueva ', 'nailoxcom@gmail.com', '643 49 11 43', '2026-04-28', '15:00', 300, 128.00, 12.80, false, NULL, 'cancelled', NULL, '2026-04-27 11:08:51.849432+00', '2026-04-27 16:28:22.116+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('6156b52a-9976-4a9f-a5ab-021580c2af3e', NULL, 'ANA PÉREZ ', 'nailoxcom@gmail.com', '677 77 77 30', '2026-04-27', '13:30', 120, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-24 15:51:13.673416+00', '2026-04-27 11:02:30.702+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('e09f35fb-b4d2-4680-8cbc-ca5334fa6cc1', NULL, 'Ana Pérez ', 'nailoxcom@gmail.com', '677 77 77 30', '2026-04-28', '13:00', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-27 11:04:59.340944+00', '2026-04-27 11:09:17.774+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('b5d1af60-d8a9-474e-a0e1-a586144f95e3', NULL, 'CRISTINA ', 'nailoxcom@gmail.com', '610 66 92 13', '2026-05-01', '12:00', 60, 30.00, 3.00, false, NULL, 'confirmed', NULL, '2026-04-28 13:50:59.648218+00', '2026-04-28 13:52:09.237+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('89ffb21a-ac9f-43f4-a378-3b19eedb596f', NULL, 'Carmen ', 'nailoxcom@gmail.com', '652 38 68 88', '2026-04-29', '14:30', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-27 11:15:07.864459+00', '2026-04-27 11:18:37.445+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('439fce11-5651-4c4b-ac99-151085350129', NULL, 'Marta ', 'nailoxcom@gmail.com', '638 96 74 19', '2026-04-28', '18:30', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-27 16:30:38.108259+00', '2026-04-27 16:31:12.966+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('a7f70170-a985-4062-a4ca-43f4db40912c', NULL, 'ADRIANA NUEVA ', 'nailoxcom@gmail.com', '643 49 11 43', '2026-04-28', '15:00', 180, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-27 16:36:15.587705+00', '2026-04-27 16:38:37.935+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('e52512d9-8d05-4727-944c-632740b17bb9', NULL, 'ALEX ', 'nailoxcom@gmail.com', '747 74 87 41', '2026-04-29', '11:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-24 14:46:29.646795+00', '2026-04-28 12:56:50.499+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('3071ba89-5abf-4801-b3ca-86f32abe814d', NULL, 'ALEX ', 'nailoxcom@gmail.com', '747 74 87 41', '2026-04-30', '11:30', 120, 60.00, 6.00, false, NULL, 'cancelled', NULL, '2026-04-28 12:58:56.890504+00', '2026-04-29 14:06:49.546+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('7bce89e6-7ab7-4372-b138-ac398ad03a26', NULL, 'ALEJANDRA ', 'nailoxcom@gmail.com', '683 32 85 44', '2026-04-30', '19:00', 120, 60.00, 6.00, false, NULL, 'confirmed', NULL, '2026-04-28 13:01:44.466644+00', '2026-04-28 13:02:28.666+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('b0afc71e-cf4e-41e5-af7f-0fe9e0a0c230', NULL, 'KELLY ', 'nailoxcom@gmail.com', '658 60 76 40', '2026-05-11', '11:00', 180, 68.00, 6.80, false, NULL, 'confirmed', NULL, '2026-04-28 13:04:51.411807+00', '2026-04-28 13:05:12.566+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('dcb3e092-48f7-4a8d-8741-090d4320cca4', NULL, 'ANA PÉREZ ', 'nailoxcom@gmail.com', '677 77 77 30', '2026-05-22', '13:00', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-28 13:08:57.234078+00', '2026-04-28 13:09:11.947+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('ed756eac-7e55-4a7f-ae75-2366d1c21db5', NULL, 'ANA NUEVA ', 'nailoxcom@gmail.com', '666 93 75 51', '2026-04-29', '17:30', 60, 32.00, 3.20, false, NULL, 'confirmed', NULL, '2026-04-28 19:04:32.093447+00', '2026-04-28 19:04:54.433+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('839b6fc5-5085-42f3-942f-4cf911b24b47', NULL, 'LILO JENY TRUJILLO', 'https://nailox.com/reservar', '+41 77 948 18 21', '2026-05-06', '15:00', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-29 10:22:55.447938+00', '2026-04-29 13:52:53.694+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('94fd1867-274f-4c44-a4a3-06f7668f53af', NULL, 'ANTÓN ', 'nailoxcom@gmail.com', '674 02 76 60', '2026-05-04', '15:00', 60, 30.00, 3.00, false, NULL, 'confirmed', NULL, '2026-04-29 13:58:54.567545+00', '2026-04-29 14:03:47.62+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('1e206f66-7ad4-4f25-b724-6938a4745d63', NULL, 'DAGMARA', 'nailoxcom@gmail.com', '722 50 74 67', '2026-04-30', '11:00', 120, 38.00, 3.80, false, NULL, 'confirmed', NULL, '2026-04-29 16:35:05.799439+00', '2026-04-29 16:35:33.747+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('641962d5-e56b-4c50-baa8-0a5e9bfcfa74', NULL, 'FANNY', 'nailoxcom@gmail.com', '663 27 05 08', '2026-05-01', '16:00', 120, 38.00, 3.80, false, NULL, 'cancelled', NULL, '2026-04-24 14:39:24.499765+00', '2026-04-30 14:01:36.294+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('8a7e2f06-ca34-4414-9df0-b50eb0e00195', NULL, 'PAULA PESO', 'https://nailox.com/reservar', '638482642', '2026-05-04', '11:00', 120, 45.00, 4.50, false, NULL, 'confirmed', NULL, '2026-04-30 13:45:45.403185+00', '2026-04-30 14:17:53.763+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('afde26e9-b45c-482d-9c17-aa6761cd0228', NULL, 'Paula Peso Abad', 'paulapesoabad@gmail.com', '638482642', '2026-05-01', '08:00', 120, 45.00, 4.50, false, NULL, 'cancelled', NULL, '2026-04-29 12:40:43.228388+00', '2026-04-30 14:18:42.643+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum'),
	('cd4acff5-8e04-466e-855d-40f22187aca5', NULL, 'ALEX', 'nailoxcom@gmail.com', '+34 747 74 87 41', '2026-05-01', '09:30', 120, 60.00, 6.00, false, NULL, 'pending', NULL, '2026-04-30 14:24:12.243916+00', '2026-04-30 14:24:12.243916+00', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, 'bizum');


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."services" ("id", "name", "description", "duration_minutes", "price", "service_type", "active", "created_at", "updated_at", "reward_points", "order_index") VALUES
	('b745d416-79cd-4ea9-a3f1-f1bce76512a5', 'Manicura Clásica', 'Limado, cutículas, esmaltado tradicional de larga duración con acabado perfecto.', 30, 20.00, 'Manicura', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('64f29a5f-399b-43a7-a700-9033ce925476', 'Manicura con Gel UV', 'Manicura completa con esmalte semipermanente de gel. Mayor durabilidad y brillo.', 60, 35.00, 'Manicura', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('3b847071-45a3-4548-88b0-975dafd12cf2', 'Pedicura Clásica', 'Tratamiento completo de pies: limado, exfoliación, cutículas y esmaltado.', 45, 28.00, 'Pedicura', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('11d74972-4a31-4545-b37c-1c5c486b568b', 'Pedicura con Gel UV', 'Pedicura completa con esmalte semipermanente gel para máxima duración.', 75, 45.00, 'Pedicura', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('f2316493-46bd-47ac-aec5-b6db1ff79de1', 'Uñas Acrílicas Completas', 'Construcción completa de uñas acrílicas con diseño personalizado incluido.', 120, 65.00, 'Acrílicas', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('4796e611-eb94-4fd5-a981-6766464740c3', 'Nail Art Básico', 'Diseños geométricos, degradados o motivos simples sobre uñas preparadas.', 30, 15.00, 'Nail Art', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('acf96f5d-7826-40b5-b48c-d7dd97a4e3a8', 'Nail Art Avanzado', 'Diseños detallados, 3D, encapsulados o personalizados de alta complejidad.', 60, 35.00, 'Nail Art', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('05e2f38d-ec1c-4b1b-be2d-53f7403ae845', 'Retiro de Producto', 'Retiro seguro de gel, acrílico o semipermanente sin dañar la uña natural.', 30, 18.00, 'Otros', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('3255ebee-1cb2-4ab0-aa7c-d1615fd4fca5', 'Pack Manicura + Pedicura', 'Manicura y pedicura clásica juntas con descuento especial incluido.', 70, 42.00, 'Manicura', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('5de6a463-2873-44ec-899d-e0d6e468ba4b', 'Tratamiento Regenerador', 'Tratamiento nutritivo intensivo para uñas dañadas o debilitadas con queratina.', 45, 25.00, 'Otros', false, '2026-04-02 02:45:01.702127+00', '2026-04-02 02:45:01.702127+00', 0, 0),
	('a0e13b04-2540-4de5-90a0-73897a53582f', 'Manicura Clásica', 'Limpieza, corte y esmaltado tradicional con esmalte convencional. Incluye hidratación de cutículas y masaje de manos.', 45, 25.00, 'Manicura', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('4b5c41c0-de48-40bd-8528-5ef1afe55b28', 'Manicura Semipermanente', 'Esmaltado en gel de larga duración (hasta 3 semanas). Incluye preparación de uñas, aplicación y curado en lámpara UV/LED.', 60, 35.00, 'Manicura', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('6a062793-4269-4d6b-b1da-7d5c8dcbacad', 'Manicura con Diseño', 'Nail art personalizado: degradados, líneas, piedras, stamping o diseños a mano alzada. El diseño se acuerda con la clienta.', 90, 55.00, 'Diseño Artístico', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('6e9bdf71-5e58-480f-bece-0d88120bd234', 'Pedicura Clásica', 'Tratamiento completo de pies: limpieza, exfoliación, hidratación y esmaltado tradicional. Incluye masaje relajante.', 60, 30.00, 'Pedicura', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('81aa85c5-7cad-4899-9cf2-f46e5b9c48bc', 'Pedicura Semipermanente', 'Pedicura con esmaltado en gel de larga duración. Incluye todos los pasos de la pedicura clásica más aplicación de gel.', 75, 45.00, 'Pedicura', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('02287518-dda1-487b-9642-e5dd00c6c190', 'Esmaltado Semipermanente', 'Aplicación de esmalte semipermanente con lámpara UV. Dura hasta 3 semanas.', 30, 20.00, 'Semipermanente', false, '2026-04-02 02:45:01.702127+00', '2026-04-05 16:44:48.835+00', 0, 0),
	('3b076ab4-5c06-4762-95f4-319145c854a7', 'Escultura en Acrílico', 'Extensión de uñas con polímero acrílico. Ideal para alargar o reforzar. Incluye formado, limado y acabado.', 120, 70.00, 'Extensiones', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('43a380ae-f680-40de-81c6-ee76e10f7d73', 'Escultura en Gel', 'Extensión de uñas con gel modelable. Resultado más natural y flexible. Incluye formado, curado y acabado.', 120, 75.00, 'Extensiones', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('ad563e38-168f-4046-a2ea-1961fadc40a7', 'Retiro de Extensiones', 'Retiro seguro de extensiones de acrílico o gel sin dañar la uña natural. Incluye hidratación post-retiro.', 30, 20.00, 'Mantenimiento', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('1c37a06d-e97a-42c7-b81e-4067e7617b2d', 'Relleno de Extensiones', 'Mantenimiento del crecimiento natural en extensiones existentes (acrílico o gel). Recomendado cada 3-4 semanas.', 75, 45.00, 'Mantenimiento', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('55aeb64b-247d-4a7a-87bf-8a0cf3cbfe20', 'Asesoría Personalizada', 'Consultoría 1:1 para resolver dudas técnicas, análisis de técnica y recomendaciones personalizadas para profesionales.', 60, 50.00, 'Formación', false, '2026-04-02 02:48:57.452257+00', '2026-04-02 02:48:57.452257+00', 0, 0),
	('de0757f5-c572-4962-836d-b7e70829a2ea', 'Prueba gratis', '', 60, 0.00, 'General', false, '2026-04-02 02:56:29.126512+00', '2026-04-02 02:56:29.126512+00', 0, 0),
	('33353c22-8d73-47b2-b488-aac718948466', 'Relleno Acrílico', 'Relleno de raíz para uñas acrílicas ya existentes. Mantiene la estructura perfecta.', 60, 40.00, 'Acrílicas', false, '2026-04-02 02:45:01.702127+00', '2026-04-04 18:21:07.972+00', 10, 0),
	('297431f6-61c4-49dc-8142-1dbdf9d94894', 'Uñas en Gel', 'Construcción completa de uñas en gel con forma y longitud a elegir.', 150, 70.00, 'Extensiones', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:34:49.862+00', 130, 0),
	('66d1bfec-e1c5-409a-959d-f126ec97456d', 'Manicura Tradicional', 'Manicura clásica con limado, cutículas y esmaltado convencional.', 30, 25.00, 'Manicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 17:09:32.793+00', 0, 0),
	('3c052f35-e876-4255-aee7-599d269b2197', 'Esmaltado Semipermanente en Manicura', 'Solo esmaltado semipermanente en manos, sin preparación adicional.', 30, 18.00, 'Manicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 16:47:44.847+00', 0, 0),
	('d64fe2d6-576f-4e9d-b1b3-65051d0f0ed0', 'Pedicura Tradicional', 'Pedicura clásica con limado, cutículas, exfoliación y esmaltado convencional.', 60, 30.00, 'Pedicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 17:09:56.94+00', 0, 0),
	('ff41da43-f76b-40e1-addf-b1ed2bd07795', 'Prueba', '', 60, 0.00, 'General', false, '2026-04-13 15:17:56.56448+00', '2026-04-13 17:46:12.878+00', 0, 0),
	('ecb80c43-5d53-4cc1-a5ca-be3fda43f279', 'Manicura completa con nivelación + pedicura tradicional', '', 120, 55.00, 'Manicura', true, '2026-04-22 18:01:04.902492+00', '2026-04-22 18:01:04.902492+00', 200, 0),
	('b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 'Pack completo con esmaltado semipermanente de larga duración en manos y pies.', 120, 60.00, 'Pack Completo', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 16:52:29.112+00', 120, 0),
	('564449cf-c7d6-4649-a282-bbb4c8899497', 'Esmaltado Semipermanente en Pedicura', 'Solo esmaltado semipermanente en pies, sin preparación adicional.', 30, 20.00, 'Pedicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 17:00:31.151+00', 0, 0),
	('62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 'Esmaltado semipermanente en manos con preparación y sellado profesional.', 60, 32.00, 'Manicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-05 17:00:55.596+00', 50, 0),
	('4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 'Es una manicura con una limpieza profunda +una nivelación para proteger la uña natural y tener un crecimiento saludable + una pedicura completa con limpieza profunda y esmaltado semi permanente ', 180, 68.00, 'Manicura', true, '2026-04-19 20:47:23.649544+00', '2026-04-21 21:09:14.933+00', 300, 0),
	('93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 'Manicura con nivelación en uña natural ', 120, 38.00, 'Manicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:28:37.484+00', 0, 0),
	('5428d5f3-cf80-4eca-8197-ef92f708d0d6', 'Manicura Semipermanente + Pedicura Tradicional', 'Combinación de manicura semipermanente en manos y pedicura tradicional en pies.', 160, 55.00, 'Pack Completo', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:29:36.741+00', 100, 0),
	('df80934a-8e2a-482f-a800-4d86fbd49657', 'Manicura y Pedicura Normal', 'Manicura y pedicura tradicional completa. Limado, cutículas y esmaltado clásico.', 120, 45.00, 'Pack Completo', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:30:52.221+00', 0, 0),
	('1648786b-2508-4beb-97c8-c373753194e6', 'Pedicura Semipermanente + Manicura Tradicional', 'Combinación de pedicura semipermanente en pies y manicura tradicional en manos.', 120, 58.00, 'Pack Completo', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:31:50.069+00', 80, 0),
	('13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 'Esmaltado semipermanente en pies con cuidado completo de cutículas y piel.', 120, 38.00, 'Pedicura', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:33:47.821+00', 70, 0),
	('7a35c2a5-dd65-4284-8806-a9fe974571b2', 'Relleno de Gel / Acrílico', 'Relleno de crecimiento para uñas en gel o acrílico con corrección de forma.', 120, 45.00, 'Mantenimiento', true, '2026-04-05 16:30:27.160945+00', '2026-04-21 21:34:07.977+00', 60, 0);


--
-- Data for Name: booking_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."booking_services" ("id", "booking_id", "service_id", "service_name", "price_at_booking", "created_at") VALUES
	('a4017aee-5c0c-4a38-8e95-c492d742a61a', '1a1d5769-4f91-4b5c-9d0c-6ee5f7bc3773', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-16 14:30:31.200289+00'),
	('018b7df6-ed0c-4200-a30e-8d8880fc9722', 'bfe546a0-9c92-483f-870d-118359a5ce37', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:01:33.307247+00'),
	('06ef5118-eef0-4429-9ada-c0e64357691c', '2d3f60b1-bd82-4693-a9f6-d9ecf52a3aa3', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-16 21:08:05.515037+00'),
	('f931b6b1-0baf-4da7-9f32-6a50f1e9e1bd', '13d177c0-3daf-4241-9aaa-b6d493fec260', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:10:04.095284+00'),
	('02bde5d8-a938-486d-848c-f751c3e25492', 'cc7d12b1-8b2e-462e-b979-51ce2ca79025', '5428d5f3-cf80-4eca-8197-ef92f708d0d6', 'Manicura Semipermanente + Pedicura Tradicional', 55.00, '2026-04-16 21:12:23.509607+00'),
	('a3df58b2-52b2-4297-b304-4b5c3bc3b254', 'f686e9b0-629f-449c-ad1f-6fe42760dac2', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:19:34.314023+00'),
	('9550ac5b-a3dc-4aea-9ae0-3dc1c3b57d22', '3598f8d1-27ff-42fb-921a-0f97c96ad389', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:21:45.479168+00'),
	('14a171b0-74b9-4fbf-ad51-4772b2355105', '99050941-b2f6-4578-aac9-f46b2140182b', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:28:22.382269+00'),
	('9bb75f79-469d-45a6-bf45-9e0cb9cb634b', '753338e0-104c-42cf-9202-0e340655864c', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-16 21:30:48.278083+00'),
	('76ec4c53-5a58-41ed-85fb-96d8f1afdad3', 'af643ff9-8d55-40c2-9527-623f07b2e47f', '62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 32.00, '2026-04-16 21:34:15.043619+00'),
	('57d803f5-db68-4e0c-ae51-b770f6316115', 'a30632dd-95f1-45eb-8787-47ee15309da1', '62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 32.00, '2026-04-16 21:36:26.703038+00'),
	('70d6c791-dfb9-4af8-a55e-b9fa928b12c5', 'd17a096b-765c-4f50-bb97-30bcc8acc1bf', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:33:25.655805+00'),
	('6a3fc2a2-6c93-4ffa-ac2c-be237e25ae68', '25b7ffff-dbaf-47ff-b123-71e6027b51b9', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:34:14.798573+00'),
	('0429f800-267f-4ba3-b77a-1f889370b0e2', 'f9708bd2-a498-48aa-b3f5-fb10439afc19', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:36:41.410143+00'),
	('9807fd03-e419-400d-a777-f6c3bafb71aa', '211c1d50-f6e0-449b-8a76-37824ebcdca2', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:44:09.327149+00'),
	('823b4539-94e4-46f6-9b7b-9c52b47b1e11', '4ed8ca66-4dfe-4c9f-84bd-7f4c5a5a41e5', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:48:50.075437+00'),
	('433b121b-33d7-4aba-aebf-8aa1b7738eaa', 'b9439f47-2104-437b-9b10-1a13cc653307', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:51:09.965139+00'),
	('0e33eff8-61c7-4220-bd6b-247d19b8944f', '4e6669b4-65e9-4ed3-a286-07cf340c5471', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-17 15:53:47.58798+00'),
	('c5d86ee3-646b-44e8-8982-11bf0f1c1612', 'ac5e9b06-3d69-4b2a-b92e-6f688411c94e', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 15:59:07.415176+00'),
	('8e11201c-3da9-47a2-8fb9-96c8ebb8e858', '6f83fc96-96c6-42ed-be72-929bde4d784b', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-17 16:35:24.6797+00'),
	('52294a95-9709-49f8-8a15-6231e9c418c0', '8a45603c-c450-47a7-b752-53f1929d0b25', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-20 15:30:04.137497+00'),
	('ec6ea036-d873-4eef-8abf-c7ad5544d218', 'c138fafc-2a38-4e9f-b316-d951fe030168', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-20 15:31:37.111487+00'),
	('b148527d-c110-4bdb-a688-f4a7c1f3b1bc', '2344d556-38fb-4592-b670-87e2ba6f9f14', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-20 15:32:57.166645+00'),
	('102c7e3d-e66c-4c77-9741-52e306c99028', '5f88eabf-4923-4c75-b9bd-56d0af43b8a2', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-20 15:38:17.567312+00'),
	('c10e2bb8-22cf-4542-9ee1-f0fa225df3de', '17aa58b1-01c5-4938-bc65-2f076083a9c1', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-20 15:42:32.385851+00'),
	('2161ebcb-fb35-497d-9831-76e10ae1e073', '903a4a03-0fa3-4780-9c87-4fbf8cdce0db', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-20 15:42:59.606041+00'),
	('37de90f7-6e95-4983-b8c9-17ec5cd570eb', '485b9c4e-ace1-4b3b-bcf5-04c5ad9d2df0', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-20 15:45:32.432324+00'),
	('4b1719cb-1832-4f56-bb5a-edb470ebbc69', 'cd4625e5-75c6-4eda-b8ee-c183f810e8f0', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-20 15:48:03.858569+00'),
	('03cf53f6-e134-4a88-8264-665f4e85f780', '5e302d2f-b7fc-4cee-9de1-295c09ea29a2', '62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 32.00, '2026-04-20 15:50:46.234142+00'),
	('4714475b-463f-4b37-9398-62911557929a', '2720f193-6f2d-49f5-ac81-0ce34386512f', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-20 20:03:39.805969+00'),
	('844239fe-e3c8-46cc-b36f-249d7cf163e2', 'cff4bfa0-852e-4963-8015-016d89b66580', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-21 14:57:54.714661+00'),
	('1180a53f-932c-4e49-994d-ab7f5fda9f50', 'cd8f4fb3-dad1-411a-b9f4-a15e430626cc', '62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 32.00, '2026-04-21 15:14:41.289387+00'),
	('50fc6dcc-3fc2-48a7-b273-f47d0e97724a', '6d329d23-d319-4f92-bb6c-a5d4220ebb02', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-21 15:16:13.988478+00'),
	('548ebc59-2206-4c64-b7ad-32d5b418aa6e', '51149acf-70e6-42f4-89b0-27a813aa4710', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-21 15:17:19.071292+00'),
	('1014c2f6-843b-410e-9304-e934b1e49dd0', '5f8e9a53-b1e7-4fbd-931e-0fdaef444c6e', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-21 17:54:28.466822+00'),
	('e9828165-960a-4b84-bd35-8f3479ad51e7', 'dac9bd0c-4895-4f8e-aa12-a7700b395b58', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-21 17:55:26.0839+00'),
	('d1021b45-8dea-401d-bced-55454c401e47', 'e8ad2ae9-990f-4d88-89e4-d5a6d6a78641', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-21 21:58:22.982208+00'),
	('8cb0c163-2551-4921-a365-33022355d999', '441715e4-3b0f-4f33-885f-24e198e5725b', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-22 07:29:07.173642+00'),
	('bd2457e1-044b-43b4-b3de-be4f329c004b', '94a67598-8ca5-433b-bced-125d556403b6', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-22 10:18:34.153213+00'),
	('293ceed6-521f-441f-a9b0-24e590463ac9', '22dff7d3-aea3-4a0a-95bb-880da9bd5c78', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-22 15:46:27.094572+00'),
	('46c6e7d9-fa79-456c-bc91-1b5791e47ab0', 'bca45d8b-6e7f-4c92-b3b3-7de8f9e53641', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-22 15:54:54.059257+00'),
	('455de2b8-655b-45c2-b7a0-8bb976734b9b', '7af86473-a96a-4ca7-8f2a-c547a0259caa', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-22 16:48:23.816763+00'),
	('6b35404e-846c-4770-a4d3-c8d83275fc70', '877bec94-abf9-458d-abbc-e2006d7b5a12', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-22 17:03:04.10441+00'),
	('679c4edb-adcb-4fda-80bc-a33bfc361023', 'e676ca49-139b-40d4-b1e3-7072f3a49cd6', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-22 17:28:16.259723+00'),
	('cc7552fd-31d7-434e-a7b9-c242cf8849d9', 'f090e972-a75a-48f5-a3c9-39b094f5f840', '564449cf-c7d6-4649-a282-bbb4c8899497', 'Esmaltado Semipermanente en Pedicura', 20.00, '2026-04-23 08:41:45.475044+00'),
	('d97afce6-a2b3-4c97-968c-032218eb177c', 'f090e972-a75a-48f5-a3c9-39b094f5f840', 'd64fe2d6-576f-4e9d-b1b3-65051d0f0ed0', 'Pedicura Tradicional', 30.00, '2026-04-23 08:41:45.475044+00'),
	('fa0c6f90-5602-4e53-bff4-08f1ae042489', '641962d5-e56b-4c50-baa8-0a5e9bfcfa74', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-24 14:39:24.686533+00'),
	('540673b7-a813-48b5-955f-1da08c719b74', 'c9fc0d52-3169-462d-bae2-169f016c7cf9', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 14:43:01.893423+00'),
	('b8d254f1-99fb-4b4f-9b5c-27af2ace8238', 'b292eccb-562d-4466-8f64-4fd2d5826287', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 14:43:41.198443+00'),
	('d7ae2ae0-e12a-4c5e-867e-bb7fc5d6574c', 'e52512d9-8d05-4727-944c-632740b17bb9', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 14:46:29.994512+00'),
	('56965a0e-68d4-494c-94de-697815c20d6c', '76a65e69-1ddc-4d31-9899-bf3ea1c82520', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 14:47:05.798048+00'),
	('0be12c76-71fe-43fc-b773-d81b462a769d', '6156b52a-9976-4a9f-a5ab-021580c2af3e', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-24 15:51:13.866121+00'),
	('b9a3a62b-d0bd-4a71-be13-96b8e464a17d', 'ec466a45-fd82-431a-b2ad-6ffe06fde374', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 15:54:21.795137+00'),
	('fca95bcf-7134-4c3d-a7c3-2631ae0fd43a', 'f84d65d2-4066-4492-b67d-076ca0fb0709', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-24 16:01:29.946515+00'),
	('e4b264d0-a5c4-4d6b-8fa5-548a186832a0', '3f93af78-e930-495a-ab5d-6a05d027fb78', 'd64fe2d6-576f-4e9d-b1b3-65051d0f0ed0', 'Pedicura Tradicional', 30.00, '2026-04-24 16:13:09.058431+00'),
	('23a00369-143f-4937-b4fd-f59dd6fe3041', 'e09f35fb-b4d2-4680-8cbc-ca5334fa6cc1', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-27 11:04:59.568471+00'),
	('9275fbe3-f773-4ebd-8588-2f101c55a52c', '5c4d5a8f-a1e4-479a-b305-40b14b409872', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-27 11:08:52.048594+00'),
	('f688a78c-5848-4fce-9aa1-ac25f4bc12bd', '5c4d5a8f-a1e4-479a-b305-40b14b409872', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-27 11:08:52.048594+00'),
	('7f2a467b-2361-4fea-b3c6-b888524f0b42', '89ffb21a-ac9f-43f4-a378-3b19eedb596f', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-27 11:15:08.159015+00'),
	('7af40098-3512-4a12-ae99-9c58cc1e331c', '617c3898-abaa-4da1-8062-44e487f70da1', 'ecb80c43-5d53-4cc1-a5ca-be3fda43f279', 'Manicura completa con nivelación + pedicura tradicional', 55.00, '2026-04-27 11:17:59.927322+00'),
	('19d92b71-9b4b-4f99-83c5-1af799830d80', '8b297a22-9d93-4860-b6c3-e3daf774227b', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-27 11:38:42.886427+00'),
	('da4c34d7-b5fa-4d06-96af-a4e5bc289076', '94b1a346-0904-4479-8d61-79eeed71e8a6', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-27 11:39:25.437055+00'),
	('dc877fd1-43cd-48c7-8ebd-317c8d577b96', '439fce11-5651-4c4b-ac99-151085350129', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-27 16:30:38.314284+00'),
	('7dad8af9-91fd-4e93-bd15-e87018ee517b', 'a7f70170-a985-4062-a4ca-43f4db40912c', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-27 16:36:15.887991+00'),
	('3f78e912-3661-4c0e-9e67-62a49f6336b2', '3071ba89-5abf-4801-b3ca-86f32abe814d', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-28 12:58:57.178073+00'),
	('4136264f-3932-43c3-98c4-6cd8f5acc378', '7bce89e6-7ab7-4372-b138-ac398ad03a26', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-28 13:01:45.040861+00'),
	('c1f8c94b-de41-4d67-b451-84e0ea9338ab', 'b0afc71e-cf4e-41e5-af7f-0fe9e0a0c230', '4bd7fb12-6949-4bda-bd23-e7937cdc7f93', 'Manicura completa con nivelación + pedicura semi permanente ', 68.00, '2026-04-28 13:04:51.635825+00'),
	('c763ff5e-04e4-4dea-8ba7-03df7df566ac', 'dcb3e092-48f7-4a8d-8741-090d4320cca4', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-28 13:08:57.481239+00'),
	('1673520d-e5e2-4150-8454-1ae1438c065d', 'af7ba25f-ebe1-419d-aa40-6876af1dee43', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-28 13:41:40.422935+00'),
	('b4016c1e-5290-478f-a5d0-fb46f00a42e6', 'b5d1af60-d8a9-474e-a0e1-a586144f95e3', 'd64fe2d6-576f-4e9d-b1b3-65051d0f0ed0', 'Pedicura Tradicional', 30.00, '2026-04-28 13:50:59.884755+00'),
	('d8a2dc78-7604-4b37-8df9-3517c8e44f02', 'ed756eac-7e55-4a7f-ae75-2366d1c21db5', '62ecc110-6409-480d-9021-19046e479abb', 'Manicura Semipermanente', 32.00, '2026-04-28 19:04:32.499521+00'),
	('3a94ee53-3a99-46ff-9e55-74f48dc1bf00', '839b6fc5-5085-42f3-942f-4cf911b24b47', '13956d5f-6559-4736-b235-49af4453a6af', 'Pedicura Semipermanente', 38.00, '2026-04-29 10:22:55.74818+00'),
	('0dccd46a-9b54-4a17-9949-bd24b4b1b9ae', 'afde26e9-b45c-482d-9c17-aa6761cd0228', '7a35c2a5-dd65-4284-8806-a9fe974571b2', 'Relleno de Gel / Acrílico', 45.00, '2026-04-29 12:40:43.58805+00'),
	('48860a1c-beba-4ddf-b639-838e54c9911d', '94fd1867-274f-4c44-a4a3-06f7668f53af', 'd64fe2d6-576f-4e9d-b1b3-65051d0f0ed0', 'Pedicura Tradicional', 30.00, '2026-04-29 13:58:54.899372+00'),
	('a25924f8-9b7f-4313-a079-add47a1071ea', '1e206f66-7ad4-4f25-b724-6938a4745d63', '93c265ea-caf4-498e-a9ea-c7989e3f063d', 'Manicura con nivelación ', 38.00, '2026-04-29 16:35:06.123025+00'),
	('890ba787-7d44-4c1d-a49f-828f30c7c014', '8a7e2f06-ca34-4414-9df0-b50eb0e00195', '7a35c2a5-dd65-4284-8806-a9fe974571b2', 'Relleno de Gel / Acrílico', 45.00, '2026-04-30 13:45:45.697146+00'),
	('d12fa8d2-7495-41f6-8a16-63a90cc00a39', 'cd4acff5-8e04-466e-855d-40f22187aca5', 'b3281663-fb43-4cd4-8060-d5dad75b0bbd', 'Manicura y Pedicura Semipermanente', 60.00, '2026-04-30 14:24:12.586767+00');


--
-- Data for Name: center_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."center_settings" ("id", "center_name", "address", "city", "postal_code", "phone", "email", "schedule", "updated_at", "academy_name", "instructor_name", "instructor_title", "course_title", "email_brand_name", "site_url", "contact_email", "sender_email", "email_footer_text", "email_header_color", "email_header_color2", "email_logo_text", "email_accent_color", "email_bg_color", "email_card_bg", "notification_email", "total_hours_override", "hero_countdown_hours", "hero_countdown_label", "hero_countdown_enabled", "bizum_whatsapp", "stripe_disabled", "presale_mode", "presale_badge_text", "presale_hero_title", "presale_hero_subtitle", "presale_cta_text", "presale_buy_btn_text", "stripe_disabled_message") VALUES
	('main', 'NAILOX Centro', 'Carrer del Rosselló, 497, Eixample', 'Barcelona', '08025', '+34 636689101', 'info@nailox.es', 'Lun-Vie 9:00-20:00 · Sáb 9:00-14:00', '2026-04-13 17:48:02.603+00', 'Academia Nailox', 'Gloria Hernandez', 'Instructora Principal', 'Manicura y Pedicura Profesional', 'NAILOX', 'https://nailox.com', 'hola@nailox.com', 'noreply@nailox.com', 'Curso Profesional de Manicura y Pedicura', '#f43f5e', '#fb7185', 'NAILOX', '#f43f5e', '#fdf2f4', '#fff1f2', NULL, '', 72, 'Oferta termina en', false, '+34636689101', true, true, '¡Preventa especial!', 'Únete a la Preventa', 'Sé de las primeras en acceder al curso completo con precio especial de lanzamiento.', 'Reservar mi plaza', 'Unirme a la preventa', 'El pago online estará disponible próximamente.');


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."certificates" ("id", "user_id", "student_name", "course_title", "academy_name", "completed_lessons", "total_modules", "total_hours", "issued_at", "created_at", "updated_at") VALUES
	('2a4195ce-2e9c-47fd-bf93-fce8d8660dda', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Paula Camila', 'Manicura y Pedicura Profesional', 'Academia Nailox', 65, 8, '23h 54min', '2026-04-13 21:09:55.642+00', '2026-04-13 21:09:55.971114+00', '2026-04-13 21:09:55.971114+00');


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: coupon_uses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: forum_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."forum_questions" ("id", "student_id", "student_name", "student_email", "category", "title", "message", "admin_reply", "replied_at", "resolved", "created_at") VALUES
	('247868e2-a65f-4578-ae46-10f7861dbf55', NULL, 'Dayron', 'dayroncmd@gmail.com', 'Técnicas', 'Prueba', 'Prueba', 'respuesta prueba', '2026-04-01 20:22:35.054+00', false, '2026-04-01 20:22:05.329103+00');


--
-- Data for Name: google_calendar_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson_tags" ("id", "name", "color", "icon", "description", "created_at") VALUES
	('01cdf863-cd73-4050-8e01-c69a52b985c3', 'Introducción', 'green', 'ri-door-open-line', 'Lecciones de bienvenida y onboarding', '2026-04-01 20:35:25.431957+00'),
	('2d57f14e-3095-4f3d-812e-b4f9346483ce', 'Práctica Avanzada', 'rose', 'ri-rocket-line', 'Ejercicios prácticos y aplicaciones', '2026-04-01 20:35:25.431957+00'),
	('787ed8d1-8747-40f8-bace-f7c0853cb26b', 'Higiene y Preparación', 'teal', 'ri-shield-check-line', 'Protocolos y normativas sanitarias', '2026-04-01 20:35:25.431957+00');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."modules" ("id", "title", "description", "duration", "order_index", "created_at", "updated_at", "level", "color", "icon", "tag_id", "price", "stripe_product_id", "stripe_price_id") VALUES
	('a0000000-0000-4000-8000-000000000001', 'Fundamentos + Higiene Profesional', 'Anatomía de la uña, herramientas esenciales, área de trabajo, higiene avanzada y normativas sanitarias internacionales.', '3h 36min', 2, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.748069+00', 'Principiante', 'rose', 'ri-palette-line', NULL, NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000000', 'Introducción y Onboarding', 'Bienvenida al curso, ruta de aprendizaje de principiante a profesional y presentación de la certificación.', '55 min', 1, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.745829+00', 'Principiante', 'rose', 'ri-star-line', NULL, 0.00, NULL, NULL),
	('a0000000-0000-4000-8000-000000000005', 'Decoración / Nail Art', 'Nail art básico y avanzado: degradados, stamping, foil, pincel artístico y tendencias 2025.', '7h 08min', 4, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.791019+00', 'Intermedio', 'rose', 'ri-magic-line', '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000002', 'Esmaltado', 'Limpieza profesional, formas, técnicas de limado y especializaciones: manicura tradicional, combinada y rusa.', '3h 17min', 3, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.779207+00', 'Principiante', 'orange', 'ri-palette-line', '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000004', 'Pedicura Profesional', 'Cuidado integral del pie: anatomía, exfoliación profesional, callosidades, hidratación y esmaltado.', '3h 07min', 6, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.799013+00', 'Principiante', 'orange', 'ri-flower-line', NULL, NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000003', 'Construcción + Aplicación de Producto', 'Esmalte normal, gel UV, acrílico, polygel, corrección de uñas y tendencias de colores 2025.', '4h 55min', 5, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.825802+00', 'Intermedio', 'rose', 'ri-drop-line', NULL, NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000006', 'Acabado + Experiencia Cliente', 'Sellado final, aceites nutritivos, presentación del trabajo y gestión de la experiencia del cliente.', '2h 00min', 7, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.816506+00', 'Intermedio', 'orange', 'ri-hand-heart-line', NULL, NULL, NULL, NULL),
	('a0000000-0000-4000-8000-000000000008', 'Evaluación Final + Certificación', 'Evaluación global del curso, proyecto final integrador y entrega del certificado oficial.', '2h 30min', 8, '2026-04-01 19:45:49.667232+00', '2026-04-04 15:12:12.813597+00', 'Avanzado', 'orange', 'ri-award-line', NULL, NULL, NULL, NULL);


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lessons" ("id", "module_id", "title", "type", "duration", "video_url", "content", "description", "order_index", "created_at", "updated_at", "is_free", "tag_id", "questions", "file_url") VALUES
	('b4e7f361-b130-4f6b-b6d4-bb8d25d28f57', 'a0000000-0000-4000-8000-000000000001', 'Tipos de piel y cutícula', 'lectura', '15 min', NULL, NULL, 'Cómo identificar el tipo de cutícula del cliente para un tratamiento adecuado.', 6, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.634997+00', false, NULL, NULL, NULL),
	('1fe93bea-433a-4481-87e0-6a61dd3d6d83', 'a0000000-0000-4000-8000-000000000001', 'Desinfección vs Esterilización: diferencias clave', 'video', '20 min', '', '', 'Cuándo esterilizar y cuándo desinfectar, y qué productos usar en cada caso.', 35, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.630326+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('be0ceffb-3ad7-4e80-8a56-3257d0d510c8', 'a0000000-0000-4000-8000-000000000000', 'Herramientas esenciales de manicura', 'video', '35 min', '', '', 'Guía visual completa de cada herramienta: limas, alicates, palitos, empujadores y más.', 13, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.727142+00', false, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, NULL),
	('549c6070-f9e8-47c3-8f76-8430f91a7aa7', 'a0000000-0000-4000-8000-000000000000', 'Presentación de certificación', 'lectura', '12 min', '', '', 'Requisitos, proceso y beneficios de la certificación oficial al completar el curso.', 28, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.742674+00', true, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, NULL),
	('9eb8f3c4-d883-48cd-b0e1-881bf86a06c1', 'a0000000-0000-4000-8000-000000000001', 'Anatomía de la uña natural', 'lectura', '20 min', '', '', 'Estructura de la uña: matriz, lecho ungueal, cutícula, eponiquio y lúnula.', 8, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.835301+00', false, NULL, NULL, NULL),
	('576b019e-67c2-4fc4-87e1-18cddf5f5d12', 'a0000000-0000-4000-8000-000000000000', 'Configuración del área de trabajo', 'video', '18 min', '', '', 'Cómo organizar tu puesto de trabajo de forma profesional y ergonómica.', 18, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.843829+00', false, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, NULL),
	('db90bf62-43ac-4485-a67c-6f4e4155e379', 'a0000000-0000-4000-8000-000000000000', 'Qué vas a lograr (promesa clara)', 'lectura', '10 min', '', '', 'Descripción detallada de los resultados esperados al completar el curso completo.', 17, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.624561+00', true, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, NULL),
	('7937e396-4f4e-4b13-aad7-030b6d981825', 'a0000000-0000-4000-8000-000000000001', 'Normativas sanitarias internacionales', 'lectura', '25 min', '', 'Prueba', 'Reglas de la OMS y normativas locales para salones de belleza profesionales.', 33, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.851527+00', false, NULL, NULL, NULL),
	('5750efc5-eff4-4f2f-9eb2-be63724c49d3', 'a0000000-0000-4000-8000-000000000001', 'Evaluación: Higiene y Certificación', 'evaluacion', '30 min', '', '', 'Examen final del módulo con 30 preguntas sobre higiene profesional y normativas.', 58, '2026-04-01 19:46:38.159981+00', '2026-04-04 15:15:35.866592+00', false, NULL, '[{"correct": 0, "options": ["a", "b", "c", "d"], "question": "Esta es la pregunta", "explanation": "explicacion"}]', NULL),
	('9c6b09be-63dc-43c7-b772-c9946086d34e', 'a0000000-0000-4000-8000-000000000000', 'Bienvenida al curso', 'video', '10 min', '', '', 'Presentación del curso, objetivos y lo que lograrás al finalizar el programa completo.', 1, '2026-04-01 19:46:38.159981+00', '2026-04-04 21:22:06.005879+00', true, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, NULL),
	('bc147479-de9d-4751-a528-461fb03e94a9', 'a0000000-0000-4000-8000-000000000005', 'Fotografía de nail art para redes', 'lectura', '15 min', NULL, NULL, 'Tips para fotografiar tus trabajos con el celular y publicarlos en redes sociales.', 41, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.847922+00', false, NULL, NULL, NULL),
	('8475551b-4f04-42c0-bf10-f115fd0c1c3b', 'a0000000-0000-4000-8000-000000000004', 'Anatomía del pie y cuidados básicos', 'video', '22 min', NULL, NULL, 'Estructura del pie, tipos de piel plantar y afecciones comunes en el cliente.', 11, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.607916+00', true, NULL, NULL, NULL),
	('7782ee33-6548-4c91-b3a1-0949805ae8b7', 'a0000000-0000-4000-8000-000000000005', 'Nail art con láminas de oro y foil', 'video', '22 min', NULL, NULL, 'Aplicación de foil metálico y láminas de oro sobre gel pegajoso para acabados luxury.', 32, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.90954+00', false, NULL, NULL, NULL),
	('56a92a5a-a6ee-4642-9398-dfd8da3587b7', 'a0000000-0000-4000-8000-000000000005', 'Diseños geométricos modernos', 'video', '40 min', NULL, NULL, 'Líneas rectas, triángulos y patrones con tape de manicura para looks editoriales.', 36, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.913644+00', false, NULL, NULL, NULL),
	('8cfd1069-1fec-4c8c-918a-7f8da3b3e0ea', 'a0000000-0000-4000-8000-000000000002', 'Evaluación del módulo', 'evaluacion', '10 min', NULL, NULL, 'Quiz de 15 preguntas sobre formas, limas y técnicas de limado profesional.', 43, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.831972+00', false, NULL, NULL, NULL),
	('72789cff-69c9-4744-85c5-81f7ccc57539', 'a0000000-0000-4000-8000-000000000005', 'Técnica de degradado / ombré', 'video', '38 min', NULL, NULL, 'Degradados con esponja, pincel y gradiente de dos o tres colores perfectamente difuminado.', 12, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.693699+00', false, NULL, NULL, NULL),
	('4fd33fb5-d851-4fab-822f-50a3b888b75c', 'a0000000-0000-4000-8000-000000000003', 'Evaluación del módulo', 'evaluacion', '20 min', NULL, NULL, 'Examen de 25 preguntas sobre tipos de esmalte, aplicación, polygel y corrección.', 65, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.875386+00', false, NULL, NULL, NULL),
	('9ab77ded-43c9-460c-b456-b598c106d422', 'a0000000-0000-4000-8000-000000000001', 'Preparación de la uña natural', 'video', '28 min', '', '', 'Paso a paso: limpieza, empuje de cutícula y aplicación de base hidratante.', 3, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.780466+00', true, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('ee7c33e3-c8d3-4efd-9d5e-5057f8a14b57', 'a0000000-0000-4000-8000-000000000003', 'Trabajo con uñas acrílicas', 'video', '60 min', NULL, NULL, 'Preparación, mezcla de polvo y monómero, y modelado sobre tip o forma.', 22, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.88609+00', false, NULL, NULL, NULL),
	('93907373-2da9-49eb-8a89-486cbdbc0df3', 'a0000000-0000-4000-8000-000000000005', 'Práctica: diseña 5 uñas distintas', 'practica', '90 min', NULL, NULL, 'Aplica 5 técnicas distintas aprendidas en una misma mano de forma cohesiva.', 37, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.904192+00', false, NULL, NULL, NULL),
	('92bcfc5a-d1c2-47de-8537-c392f0b62877', 'a0000000-0000-4000-8000-000000000001', 'Técnica de limado sin dañar la uña', 'video', '22 min', '', '', 'La dirección correcta, la presión adecuada y los errores más comunes a evitar.', 23, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.81247+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('1550de41-2b82-4bcf-b768-2ba3b7ea12b7', 'a0000000-0000-4000-8000-000000000002', 'Esmalte semipermanente (gel UV)', 'video', '45 min', '', '', 'Base coat, color y top coat. Curado en lámpara LED y limpieza de inhibición.', 16, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.832709+00', false, NULL, NULL, NULL),
	('b2460a4f-1987-479c-99de-10fcc981c929', 'a0000000-0000-4000-8000-000000000005', 'Estampado con sellos (stamping)', 'video', '28 min', NULL, NULL, 'Técnica de stamping: placas, stamper y esmaltes especiales para sellar diseños.', 29, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.826196+00', false, NULL, NULL, NULL),
	('bc5477ed-e80a-4468-b1fc-d37490826a87', 'a0000000-0000-4000-8000-000000000003', 'Diferencias entre esmalte normal, gel y acrílico', 'video', '20 min', NULL, NULL, 'Comparativa visual de los tres sistemas: durabilidad, aplicación y resultados esperados.', 10, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.635299+00', true, NULL, NULL, NULL),
	('2df30f0a-f7a6-453f-9d30-aef970a045e1', 'a0000000-0000-4000-8000-000000000003', 'Tips para clientes con uñas dañadas', 'lectura', '15 min', NULL, NULL, 'Tratamientos previos y recomendaciones para uñas frágiles, mordidas o dañadas.', 38, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.916971+00', false, NULL, NULL, NULL),
	('41d65b50-0379-42a5-9590-7fb36b94e1d2', 'a0000000-0000-4000-8000-000000000004', 'Tratamiento de callosidades', 'video', '35 min', NULL, NULL, 'Cómo identificar y tratar callosidades suaves, duras y plantares con bisturí.', 25, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.832874+00', false, NULL, NULL, NULL),
	('846c10a0-7fbb-4fa9-a3e7-5af7e4a09a4c', 'a0000000-0000-4000-8000-000000000005', 'Rayas y líneas con liner brush', 'video', '35 min', NULL, NULL, 'Cómo trazar líneas rectas, curvas y onduladas con pincel liner de precisión.', 26, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.639699+00', false, NULL, NULL, NULL),
	('605a89d3-355a-4df2-9513-a65ac1514892', 'a0000000-0000-4000-8000-000000000005', 'Tendencias de nail art 2025', 'video', '20 min', NULL, NULL, 'Los estilos más buscados: minimal, aura nails, glass nails y 3D floral.', 44, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.845568+00', false, NULL, NULL, NULL),
	('e07ffbdb-42c6-4fce-915b-96fdf7d87c79', 'a0000000-0000-4000-8000-000000000001', 'Tipos de limas y granos', 'lectura', '12 min', '', '', 'Diferencias entre limas de 80, 100, 180 y 240 granos y cuándo usar cada una.', 24, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.701131+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('f1b30f07-930f-48fe-ab68-bb6bf3cd321d', 'a0000000-0000-4000-8000-000000000005', 'Práctica final: diseño completo de 10 uñas', 'practica', '120 min', NULL, NULL, 'Trabajo final del módulo: crea un diseño cohesivo y profesional en las 10 uñas.', 48, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.905243+00', false, NULL, NULL, NULL),
	('ebec19b4-2d19-46d2-9ec1-7f41f3b2a3c9', 'a0000000-0000-4000-8000-000000000003', 'Retiro seguro de esmalte gel', 'video', '25 min', NULL, NULL, 'Método de acetona con papel aluminio y cómo proteger la uña durante el retiro.', 31, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.756+00', false, NULL, NULL, NULL),
	('65406bad-50ae-47e5-830c-0b9e185c1f0c', 'a0000000-0000-4000-8000-000000000005', 'Puntos y flores con dotting tool', 'video', '30 min', NULL, NULL, 'Diseños con puntos de diferentes tamaños y flores básicas con la herramienta dotting.', 19, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.775132+00', false, NULL, NULL, NULL),
	('03fd0c15-c1f8-4501-9654-d7da1afba15d', 'a0000000-0000-4000-8000-000000000001', 'Formas de uña: cuadrada, redonda y ovalada', 'video', '25 min', '', '', 'Cómo lograr cada forma con precisión y qué herramientas usar en cada caso.', 7, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.844889+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('1a31a631-73ea-4634-92ce-4e7b32dfc809', 'a0000000-0000-4000-8000-000000000004', 'Evaluación del módulo', 'evaluacion', '15 min', NULL, NULL, 'Test sobre anatomía del pie, exfoliación y técnica de pedicura completa.', 34, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.903833+00', false, NULL, NULL, NULL),
	('05630dc4-033d-45b4-8191-87a1c8916cdc', 'a0000000-0000-4000-8000-000000000003', 'Como y para que nos sirve el Burdegel ', 'video', '10', '', '', 'aaaa', 59, '2026-04-02 17:53:22.589468+00', '2026-04-04 15:15:35.697536+00', false, NULL, NULL, NULL),
	('4e22fe4d-5e01-4aff-a35b-99f6d9a605aa', 'a0000000-0000-4000-8000-000000000003', 'Tipos de geles para reconstruir', 'video', '10', '', '', 'aaaa', 62, '2026-04-02 17:54:54.319943+00', '2026-04-04 15:15:35.865212+00', false, NULL, NULL, NULL),
	('11a38fcb-b32b-4c54-b72a-662a14a5b9cb', 'a0000000-0000-4000-8000-000000000000', 'Cómo usar el foro de la comunidad', 'video', '10 min', '', '', 'Guía para participar en el foro, hacer preguntas y compartir tus avances con el grupo.', 2, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.901794+00', false, NULL, NULL, NULL),
	('8e6f1df5-0fda-4bc9-b5a9-e7e26c83939e', 'a0000000-0000-4000-8000-000000000000', 'Guía de Herramientas Esenciales de Manicura', 'material', '4.2 MB · PDF', '', '', 'Catálogo completo con descripción, uso y mantenimiento de cada herramienta profesional: limas, alicates, empujadores y más.', 51, '2026-04-02 14:18:58.352991+00', '2026-04-04 15:15:35.707777+00', true, '01cdf863-cd73-4050-8e01-c69a52b985c3', NULL, 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf'),
	('8b6bfbfe-3769-447c-8810-ded1487c9c47', 'a0000000-0000-4000-8000-000000000002', 'Esmaltado Semipermanente', 'video', '10', '', '', 'aaa', 42, '2026-04-02 17:48:29.298069+00', '2026-04-04 15:15:35.84069+00', false, '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL),
	('68769585-52eb-4aff-9d19-f4721779ac29', 'a0000000-0000-4000-8000-000000000001', 'Protocolo de Higiene y Desinfección', 'material', '2.7 MB · PDF', '', '', 'Checklist profesional con todos los pasos de desinfección según normativas sanitarias internacionales. Imprimible.', 57, '2026-04-02 14:18:58.352991+00', '2026-04-04 15:15:35.906639+00', true, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf'),
	('db009567-7be8-4f0b-a7a3-b2d6f387fadc', 'a0000000-0000-4000-8000-000000000006', 'Aceites y cuidado post-servicio', 'video', '15 min', NULL, NULL, 'Uso de aceites de cutícula, cremas nutritivas y rutina de mantenimiento para la cliente.', 14, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.843642+00', false, NULL, NULL, NULL),
	('6fc1bde9-824f-4af4-8079-2ea6b4e542fa', 'a0000000-0000-4000-8000-000000000003', 'Como y para que nos sirve el Ruber Base', 'video', '10', '', '', 'aaa', 61, '2026-04-02 17:54:15.641066+00', '2026-04-04 15:15:35.872107+00', false, '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL),
	('c0438216-3e9c-462a-a7d6-0fe59d36db3c', 'a0000000-0000-4000-8000-000000000001', 'Preparación de la uña manicura en seco', 'video', '20', '', '', 'a', 45, '2026-04-02 17:34:39.428292+00', '2026-04-04 15:15:35.9097+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('9348cbc0-13e9-4fa4-bb8f-61d691fff329', 'a0000000-0000-4000-8000-000000000000', 'Reconstruccion con dual system', 'video', '10', '', '', 'aaaa', 50, '2026-04-02 17:55:46.300278+00', '2026-04-04 15:15:35.918529+00', false, NULL, NULL, NULL),
	('713edf94-5d06-4ae7-b5fa-b31f0113f159', 'a0000000-0000-4000-8000-000000000005', 'Evaluación del módulo', 'evaluacion', '20 min', NULL, NULL, 'Examen teórico y envío de fotos del trabajo práctico para evaluación personalizada.', 53, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.920818+00', false, NULL, NULL, NULL),
	('f8ce3dee-d301-42af-8980-9b3355951d6b', 'a0000000-0000-4000-8000-000000000000', 'Como y para que nos sirve el Acrigel', 'video', '10', '', '', 'aaaa', 47, '2026-04-02 17:53:58.880865+00', '2026-04-04 15:15:35.91487+00', false, NULL, NULL, NULL),
	('28eee06e-3a25-481b-9a40-76bf2b817f0b', 'a0000000-0000-4000-8000-000000000001', 'Protocolo de higiene general', 'video', '10', '', '', 'Como realizar', 56, '2026-04-02 17:42:49.699495+00', '2026-04-04 15:15:35.772728+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('7bc56c1d-64eb-4dd2-a90f-8f630e2aa6e3', 'a0000000-0000-4000-8000-000000000006', 'Experiencia y fidelización del cliente', 'video', '25 min', NULL, NULL, 'Estrategias para crear una experiencia memorable y fidelizar a tus clientes a largo plazo.', 27, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.663074+00', false, NULL, NULL, NULL),
	('a50f35c1-b92a-4ed2-878c-5bcb9dde1869', 'a0000000-0000-4000-8000-000000000003', 'Reconstruccion en uña natural', 'video', '10', '', '', 'aaaa', 55, '2026-04-02 17:51:52.815823+00', '2026-04-04 15:15:35.726008+00', false, NULL, NULL, NULL),
	('af668c93-10fd-48c3-8269-051d367122fd', 'a0000000-0000-4000-8000-000000000002', 'Esmaltado Tradicional', 'video', '10', '', '', 'aa', 39, '2026-04-02 17:48:08.308562+00', '2026-04-04 15:15:35.880448+00', false, NULL, NULL, NULL),
	('52fd9aa4-cdec-46b9-993b-ac5b35b08727', 'a0000000-0000-4000-8000-000000000008', 'Evaluación global del curso', 'evaluacion', '45 min', NULL, NULL, 'Examen final integrador que cubre todos los módulos del programa completo.', 9, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.72343+00', false, NULL, NULL, NULL),
	('155987c1-ccdd-43a1-8f05-f33630c4339a', 'a0000000-0000-4000-8000-000000000003', 'Como y para que nos sirve el geli gel ', 'video', '10', '', '', 'aa', 60, '2026-04-02 17:53:45.306587+00', '2026-04-04 15:15:35.912894+00', false, NULL, NULL, NULL),
	('463c1810-a135-4377-bcd0-179c5204a2d2', 'a0000000-0000-4000-8000-000000000005', 'Introducción al nail art y materiales', 'video', '25 min', '', '', 'Qué es el nail art, qué materiales necesitas y los estilos más populares en 2025.', 5, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.845026+00', false, NULL, NULL, NULL),
	('daeef6de-0d11-4bdf-b0d8-8bea3293f931', 'a0000000-0000-4000-8000-000000000003', 'Tabla de Mezclas Acrílicas', 'material', '1.1 MB · PDF', NULL, NULL, 'Proporciones exactas para mezclar polvo acrílico y monómero según el efecto y consistencia deseada. Referencia rápida.', 64, '2026-04-02 14:18:58.352991+00', '2026-04-04 15:15:35.857631+00', true, NULL, NULL, 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf'),
	('857b714f-238c-41ad-8d55-dac4d020a216', 'a0000000-0000-4000-8000-000000000005', 'Catálogo de Diseños Nail Art 2025', 'material', '22 MB · Imágenes', NULL, NULL, 'Más de 200 diseños de nail art organizados por dificultad: básico, intermedio y avanzado, con instrucciones simplificadas.', 54, '2026-04-02 14:18:58.352991+00', '2026-04-04 15:15:35.748843+00', true, NULL, NULL, 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF4.pdf'),
	('9ea4dd65-6283-4992-835d-bf1ee261e4f3', 'a0000000-0000-4000-8000-000000000006', 'Presentación del trabajo terminado', 'lectura', '20 min', NULL, NULL, 'Cómo mostrar el resultado final: fotografías, revisión con la cliente y retoque profesional.', 20, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.607641+00', false, NULL, NULL, NULL),
	('27bf75ea-877d-4390-b901-9b9b0e9d6673', 'a0000000-0000-4000-8000-000000000001', 'Preparación de la uña con agua', 'video', '20', '', '', 'agua', 46, '2026-04-02 17:35:42.137266+00', '2026-04-04 15:15:35.861348+00', false, NULL, NULL, NULL),
	('1652eacb-80dd-4a57-a88a-ed53da976722', 'a0000000-0000-4000-8000-000000000001', 'Manejo de Alteraciones Ungueales', 'video', '20', '', '', 'Esta lección aborda la identificación y manejo técnico de traumatismos ungueales y onicomicosis, incluyendo cambios morfológicos, signos clínicos, contraindicaciones y protocolos de bioseguridad. Se enfatiza la evaluación profesional, la prevención de contagios y la correcta derivación cuando sea necesario.', 49, '2026-04-02 17:40:56.69971+00', '2026-04-04 15:15:35.859369+00', false, '787ed8d1-8747-40f8-bace-f7c0853cb26b', NULL, NULL),
	('f738cd3c-d2f5-42ea-aa49-7a71e1c2a934', 'a0000000-0000-4000-8000-000000000004', 'Manual de Pedicura Profesional', 'material', '8.3 MB · PDF', NULL, NULL, 'Guía completa de pedicura: exfoliación, tratamiento de callosidades, uñas encarnadas y protocolo de masaje relajante.', 40, '2026-04-02 14:18:58.352991+00', '2026-04-04 15:15:35.897732+00', true, NULL, NULL, 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF5.pdf'),
	('59f39eff-cc66-4f9e-8367-276bda5213d9', 'a0000000-0000-4000-8000-000000000003', 'Nivelacion en uña natural', 'video', '10', '', '', 'aa', 52, '2026-04-02 17:51:36.433055+00', '2026-04-04 15:15:35.901361+00', false, NULL, NULL, NULL),
	('20ae8cc2-753b-48f6-92f6-d6716767d6fe', 'a0000000-0000-4000-8000-000000000004', 'Técnica de exfoliación profesional', 'video', '30 min', NULL, NULL, 'Uso de piedra pómez, lima de pie y cremas exfoliantes para una piel suave.', 21, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.614212+00', false, NULL, NULL, NULL),
	('9ada6ba5-09df-45d9-bf5b-6d370ecfaf4b', 'a0000000-0000-4000-8000-000000000002', 'Aplicación de esmalte normal perfecto', 'video', '32 min', '', '', 'Técnica de tres trazos, secuencia de capas y tiempo de secado correcto.', 15, '2026-04-01 19:47:00.794737+00', '2026-04-04 15:15:35.72767+00', false, NULL, NULL, NULL),
	('fd476050-269a-49d1-bb60-c4b04f86d6e8', 'a0000000-0000-4000-8000-000000000003', 'Sellado final y top coat profesional', 'video', '20 min', '', '', 'Técnicas de sellado duradero: top coats para gel, acrílico y esmalte normal.', 4, '2026-04-01 19:47:53.353125+00', '2026-04-04 15:15:35.844413+00', false, '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL),
	('28f64cb8-e9cd-42bd-8cec-575533dabfe1', 'a0000000-0000-4000-8000-000000000004', 'Aplicación de esmalte en pies', 'video', '25 min', NULL, NULL, 'Uso de separadores, técnica de aplicación en uñas de pie y secado correcto.', 30, '2026-04-01 19:47:25.24052+00', '2026-04-04 15:15:35.882038+00', false, NULL, NULL, NULL),
	('fc4bfddc-430d-4230-82dc-09d74461cfab', 'a0000000-0000-4000-8000-000000000003', 'Como y para que nos sirve el Poli gel', 'video', '10', '', '', 'aaaaa', 63, '2026-04-02 17:56:19.659382+00', '2026-04-04 15:15:35.908713+00', false, '2d57f14e-3095-4f3d-812e-b4f9346483ce', NULL, NULL);


--
-- Data for Name: points_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: professional_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."professional_profiles" ("id", "user_id", "bio", "specialties", "instagram", "portfolio_images", "rating", "review_count", "active", "created_at", "updated_at", "address") VALUES
	('922da061-2a7c-4ec2-8821-cf9faaee0c83', '427ec20a-1c72-4fcd-864f-a0090f7d0176', NULL, '{}', NULL, NULL, 0, 0, false, '2026-04-09 22:31:06.100388+00', '2026-04-09 22:31:06.100388+00', NULL),
	('27017b1a-67f1-47ae-8587-f20f65c3d987', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', NULL, '{}', '@gloria_hernandez_nails_studio', NULL, 0, 0, false, '2026-04-04 22:13:30.795831+00', '2026-04-13 16:04:32.502+00', 'Carrer del Rosselló, 497, Eixample, 08025 Barcelona');


--
-- Data for Name: professional_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: professional_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."professional_schedules" ("id", "profile_id", "day_of_week", "is_working", "start_time", "end_time", "created_at", "updated_at") VALUES
	('24adb6d3-dea7-4f52-ad42-8fc8d7f74436', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 1, true, '08:00:00', '21:00:00', '2026-04-13 15:45:12.257036+00', '2026-04-27 11:32:08.853+00'),
	('ac0ac240-be5f-4ffa-bc23-0420e44b91e6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 2, true, '08:00:00', '21:00:00', '2026-04-13 15:45:12.630026+00', '2026-04-27 11:32:09.011+00'),
	('486e0350-2d33-48e5-bdce-ae85308962f2', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 3, true, '08:00:00', '21:00:00', '2026-04-13 15:45:13.053966+00', '2026-04-27 11:32:09.151+00'),
	('6f47a0aa-317a-4203-8906-12ae68c9ac3e', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 4, true, '08:00:00', '21:00:00', '2026-04-13 15:45:13.424353+00', '2026-04-27 11:32:09.281+00'),
	('4fb7b421-e7bb-43e5-9f4c-d62545723bf6', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 5, true, '08:00:00', '21:00:00', '2026-04-13 15:45:13.772625+00', '2026-04-27 11:32:09.412+00'),
	('3ef202f2-43dc-48e3-ad19-9a25bc960541', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 6, true, '08:00:00', '14:00:00', '2026-04-13 15:45:14.191809+00', '2026-04-27 11:32:09.535+00'),
	('36afe69d-9f90-4a58-a2a0-e49727a1c79d', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 0, false, '09:00:00', '19:00:00', '2026-04-13 15:45:14.679829+00', '2026-04-27 11:32:09.659+00');


--
-- Data for Name: professional_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."professional_settings" ("id", "profile_id", "display_name", "bio", "photo_url", "slot_duration_minutes", "buffer_minutes", "is_active", "created_at", "updated_at", "google_calendar_connected") VALUES
	('a47ecb05-3533-42b8-b654-61c593bebc77', '1fbcc848-6e00-4f8e-81ef-91d4b505c724', 'Gloria Hernandez', 'Especialista en nails, educadora y experta en belleza. Apasionada por crear, perfeccionar y elevar estándares en la industria. Cofundadora de NAILOX.', NULL, 30, 10, true, '2026-04-13 15:45:11.599674+00', '2026-04-27 11:32:08.626+00', false);


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."purchases" ("id", "email", "product_id", "session_id", "amount_total", "currency", "status", "created_at") VALUES
	('246e9749-d5c1-426f-bc48-abf73f4daca6', 'dayroncmd@gmail.com', 'prod_UG5ehG9IrGh4hl', 'cs_test_a18iI4IDrixSScqh9m25SpABQuHvyJcnnI5Ii5bKfAwS6HFPq52F0pMKyy', 100, 'eur', 'completed', '2026-04-02 12:52:48.49332+00');


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: shop_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shop_orders" ("id", "user_id", "client_name", "client_email", "client_phone", "delivery_type", "delivery_address", "items", "total_price", "points_earned", "status", "notes", "created_at", "updated_at", "payment_method") VALUES
	('a494e008-e0f2-4732-bffe-5d8549ec7717', NULL, 'Prueba', 'dayroncmd@yahoo.com', '685486408', 'pickup', 'Calle Ejemplo 123, Madrid, España, Madrid 28001', '[{"qty": 1, "name": "Top Coat No Wipe 10ml", "price": 8.5, "product_id": "238e876f-ad62-4cdc-a67e-7ea1ebcb2163"}]', 8.5, 40, 'cancelled', 'lal alala al', '2026-04-04 17:52:42.86466+00', '2026-04-04 18:32:40.884+00', 'stripe'),
	('163bb70f-6e92-4ba0-b451-a85baa2a3c7b', NULL, 'Dayron', 'dayroncmd@gmail.com', '', 'digital', 'Producto digital', '[{"qty": 1, "name": "Curso Online Completo", "price": 89, "source": "stripe", "product_id": "stripe_prod_UG5ehG9IrGh4hl"}]', 89, 0, 'cancelled', NULL, '2026-04-13 15:00:41.522381+00', '2026-04-13 16:30:47.85+00', 'stripe'),
	('986c9e46-3058-46d9-bc3e-c6f8be8ed93a', NULL, 'Dayron', 'dayroncmd@gmail.com', '', 'digital', 'Producto digital', '[{"qty": 1, "name": "Curso Online Completo", "price": 89, "source": "stripe", "product_id": "stripe_prod_UG5ehG9IrGh4hl"}]', 89, 0, 'cancelled', NULL, '2026-04-13 14:59:39.509598+00', '2026-04-13 16:30:51.695+00', 'stripe');


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shop_products" ("id", "name", "description", "price", "stock", "image_url", "category", "reward_points", "active", "created_at", "updated_at") VALUES
	('7c8170f3-ee49-4478-b172-945744762f68', 'Kit Iniciación Manicura', 'Kit completo para empezar: lima, base, top coat, cutícula y esmaltes básicos. Ideal para principiantes que quieren practicar desde casa.', 29.90, 50, NULL, 'Kits', 150, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00'),
	('dd731001-8fec-45d0-a5d0-7b7b98a1ec63', 'Set Pinceles Nail Art (12 pcs)', 'Juego de 12 pinceles profesionales para nail art: liner, detalle, abanico, degradado y más. Mango ergonómico antideslizante.', 18.50, 30, NULL, 'Herramientas', 90, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00'),
	('f4b18923-a394-4d22-94d6-53302bbd341e', 'Lámpara UV/LED 48W', 'Lámpara profesional UV/LED de 48W con temporizador 30/60/90s. Compatible con todos los geles y semipermanentes del mercado.', 34.95, 20, NULL, 'Equipos', 175, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00'),
	('053fca56-0af2-42d3-8ec8-a3436eb9116c', 'Gel Constructor Nude 15ml', 'Gel constructor de alta viscosidad en tono nude natural. Ideal para extensiones y refuerzos. Curado en 60s con lámpara LED.', 12.90, 80, NULL, 'Geles', 65, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00'),
	('238e876f-ad62-4cdc-a67e-7ea1ebcb2163', 'Top Coat No Wipe 10ml', 'Top coat sin residuo pegajoso de larga duración. Acabado espejo ultra brillante. Compatible con gel y semipermanente.', 8.50, 100, NULL, 'Esmaltes', 40, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00'),
	('cc310229-6898-44d0-ab44-b58f0a5466ad', 'Kit Polygel Completo', 'Kit completo de polygel con 6 colores, slip solution, moldes, lima y pincel. Todo lo necesario para extensiones polygel profesionales.', 45.00, 15, NULL, 'Kits', 225, false, '2026-04-04 16:31:46.861652+00', '2026-04-04 16:31:46.861652+00');


--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('shop-images', 'shop-images', NULL, '2026-04-04 16:38:29.681342+00', '2026-04-04 16:38:29.681342+00', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/gif}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 253, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 7lZeZIuvfISTjUI4VPttedgWzDtScvgJPS5RetuAz3nnsRedooXnXwe918Lye9R

RESET ALL;
