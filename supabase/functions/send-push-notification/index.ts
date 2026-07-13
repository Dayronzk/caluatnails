// send-push-notification Edge Function (Production Clean)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const enc = new TextEncoder();

function b64UrlEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64UrlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  return Uint8Array.from(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)), c => c.charCodeAt(0));
}

async function encrypt(plaintext: string, p256dhB64: string, authB64: string) {
  const uaPub = b64UrlDecode(p256dhB64);
  const uaAuth = b64UrlDecode(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const asKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', asKP.publicKey));
  const shared = await crypto.subtle.deriveBits({ 
    name: 'ECDH', 
    public: await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []) 
  }, asKP.privateKey, 256);

  const ikm = await crypto.subtle.deriveBits({
    name: 'HKDF', hash: 'SHA-256', salt: uaAuth,
    info: new Uint8Array([...enc.encode('WebPush: info\x00'), ...uaPub, ...asPub])
  }, await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveBits']), 256);

  const prkKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const cek = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: salt, info: enc.encode('Content-Encoding: aes128gcm\x00') }, prkKey, 128);
  const nonce = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: salt, info: enc.encode('Content-Encoding: nonce\x00') }, prkKey, 96);

  const data = new Uint8Array([...enc.encode(plaintext), 2]);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']), data);

  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096, false);
  return new Uint8Array([...salt, ...rs, asPub.length, ...asPub, ...new Uint8Array(ciphertext)]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
  
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {
      _send_all, endpoint, client_account_id, target_roles, professional_email, booking_id,
      title, body: txt, notification_type: reqNotificationType,
      url, urgent, tag, image,
    } = await req.json();
    
    let subs: any[] = [];

    if (_send_all) {
      const { data } = await supabase.from('push_subscriptions').select('*');
      subs = data ?? [];
    } else if (target_roles?.length || professional_email) {
      // Build user_ids from profiles by role + professional by email
      const userIds: string[] = [];

      if (target_roles?.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('role', target_roles);
        (profiles ?? []).forEach((p: any) => userIds.push(p.id));
      }

      if (professional_email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', professional_email)
          .maybeSingle();
        if (prof) userIds.push(prof.id);
      }

      if (userIds.length) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('profile_id', userIds);
        subs = data ?? [];
      }
    } else if (client_account_id) {
      const { data } = await supabase.from('push_subscriptions').select('*').eq('client_account_id', client_account_id);
      subs = data ?? [];
    } else if (endpoint) {
      const { data } = await supabase.from('push_subscriptions').select('*').eq('endpoint', endpoint);
      subs = data ?? [];
    } else {
      return new Response(JSON.stringify({ sent: 0, reason: 'missing filter' }), { headers: corsHeaders });
    }
    
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });

    let sent = 0;
    const vapidPubUrlSafe = VAPID_PUBLIC_KEY.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const privKey = await crypto.subtle.importKey('pkcs8', b64UrlDecode(VAPID_PRIVATE_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

    for (const sub of subs) {
      try {
        const payload = JSON.stringify({
          title,
          body: txt,
          url: url || null,
          urgent: !!urgent,
          tag: tag || null,
          image: image || null,
        });
        const body = await encrypt(payload, sub.p256dh, sub.auth);
        const u = new URL(sub.endpoint);
        const jwtPre = `${b64UrlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))}.${b64UrlEncode(enc.encode(JSON.stringify({ aud: `${u.protocol}//${u.host}`, exp: Math.floor(Date.now() / 1000) + 3600, sub: 'https://www.nailox.com' })))}`;
        const jwt = `${jwtPre}.${b64UrlEncode(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, enc.encode(jwtPre))))}`;

        const pushHeaders: Record<string, string> = {
          'TTL': urgent ? '300' : '86400',                 // urgent: solo 5 min (no acumular si offline)
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Authorization': `vapid t=${jwt}; k=${vapidPubUrlSafe}`,
          'Urgency': urgent ? 'high' : 'normal',           // web push spec — high = entrega inmediata
        };
        if (tag) pushHeaders['Topic'] = String(tag).slice(0, 32); // dedupe en el endpoint

        const res = await fetch(sub.endpoint, {
          method: 'POST',
          headers: pushHeaders,
          body,
        });
        
        const logBase = {
          client_account_id: sub.client_account_id || null,
          profile_id: sub.profile_id || null,
          booking_id: booking_id || null,
          channel: 'push',
          notification_type: reqNotificationType || 'push',
          event_type: reqNotificationType || 'push',
          title,
          body: txt,
          sent_at: new Date().toISOString()
        };

        if (res.ok) {
          sent++;
          await supabase.from('notification_logs').insert([{ ...logBase, status: 'sent' }]);
        } else {
          const errorText = await res.text();
          await supabase.from('notification_logs').insert([{ ...logBase, status: 'failed', error_message: `HTTP ${res.status}: ${errorText}` }]);
        }
      } catch (err: any) {
        console.error('Send error:', err.message);
        await supabase.from('notification_logs').insert([{
          client_account_id: sub.client_account_id || null,
          profile_id: sub.profile_id || null,
          booking_id: booking_id || null,
          channel: 'push',
          notification_type: reqNotificationType || 'push',
          event_type: reqNotificationType || 'push',
          title,
          body: txt,
          status: 'failed',
          error_message: err.message,
          sent_at: new Date().toISOString()
        }]);
      }
    }
    return new Response(JSON.stringify({ sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
