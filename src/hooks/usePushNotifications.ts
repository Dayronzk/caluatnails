import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BMhDUMaslGaTWclFOueKPJwqcJJvM9PrD52Sl0Y9ci09fc4DxLwiAN8u6U6yX2uncn+y9JUmqfJ/xaa7CXOzakY=';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsOptions {
  clientAccountId?: string;
  profileId?: string;
}

export function usePushNotifications({ clientAccountId, profileId }: UsePushNotificationsOptions = {}) {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    'Notification' in window;

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
    checkSubscriptionStatus();
  }, [isSupported]);

  const checkSubscriptionStatus = async () => {
    if (!isSupported) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Tu navegador no soporta notificaciones push.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // 2. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);

      if (perm !== 'granted') {
        setError('Permiso denegado. Actívalo en la configuración de tu navegador.');
        setLoading(false);
        return false;
      }

      // 3. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      // 4. Save to database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          client_account_id: clientAccountId || null,
          profile_id: profileId || null,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint',
        });

      if (dbError) throw dbError;

      // 5. Award points if haven't been awarded yet
      try {
        if (profileId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('push_points_awarded')
            .eq('id', profileId)
            .single();

          if (prof && !prof.push_points_awarded) {
            // Use the centralized SQL function we created earlier
            await supabase.rpc('award_profile_points', {
              p_user_id: profileId,
              p_client_id: null,
              p_points: 200,
              p_reason: 'Activar notificaciones push ✨'
            });
            
            await supabase
              .from('profiles')
              .update({ push_points_awarded: true })
              .eq('id', profileId);
          }
        } else if (clientAccountId) {
          const { data: ca } = await supabase
            .from('client_accounts')
            .select('push_points_awarded')
            .eq('id', clientAccountId)
            .single();

          if (ca && !ca.push_points_awarded) {
            await supabase.rpc('award_profile_points', {
              p_user_id: null,
              p_client_id: clientAccountId,
              p_points: 200,
              p_reason: 'Activar notificaciones push ✨'
            });

            await supabase
              .from('client_accounts')
              .update({ push_points_awarded: true })
              .eq('id', clientAccountId);
          }
        }
      } catch (awardErr) {
        console.error('[Push] Error awarding points:', awardErr);
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error('[Push] Subscribe error:', err);
      setError(err.message || 'Error al activar las notificaciones.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [clientAccountId, profileId, isSupported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
