import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

const ALL_ACCESS_PRODUCT_ID = 'prod_UG5ehG9IrGh4hl';

export function usePurchase() {
  const { user, loading: authLoading } = useAuth();
  const [hasPurchase, setHasPurchase] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setHasPurchase(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setLoading(true);
      try {
        // Check Stripe purchase OR admin-granted course_access
        const [{ data: purchaseData }, { data: profileData }] = await Promise.all([
          supabase
            .from('purchases')
            .select('id')
            .eq('product_id', ALL_ACCESS_PRODUCT_ID)
            .eq('email', user.email!.toLowerCase().trim())
            .eq('status', 'completed')
            .limit(1),
          supabase
            .from('profiles')
            .select('course_access')
            .eq('id', user.id)
            .maybeSingle(),
        ]);

        if (!cancelled) {
          setHasPurchase((purchaseData?.length ?? 0) > 0 || profileData?.course_access === true);
        }
      } catch {
        if (!cancelled) setHasPurchase(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { hasPurchase, loading: loading || authLoading };
}