import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface PointsTransaction {
  id: string;
  points: number;
  type: 'earned' | 'redeemed' | 'bonus' | 'referral';
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface CouponResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'points';
    value: number;
    description: string | null;
  };
  discount?: number;
  error?: string;
}

export function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profile }, { data: txs }] = await Promise.all([
      supabase.from('profiles').select('points').eq('id', user.id).maybeSingle(),
      supabase
        .from('unified_points_transactions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    setPoints(profile?.points ?? 0);
    setTransactions((txs ?? []) as PointsTransaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const addPoints = useCallback(
    async (amount: number, description: string, type: PointsTransaction['type'] = 'earned', referenceId?: string) => {
      if (!user) return;
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: amount,
        type,
        description,
        reference_id: referenceId ?? null,
      });
      await supabase
        .from('profiles')
        .update({ points: points + amount })
        .eq('id', user.id);
      setPoints((p) => p + amount);
      await fetchPoints();
    },
    [user, points, fetchPoints]
  );

  const redeemPoints = useCallback(
    async (amount: number, description: string): Promise<boolean> => {
      if (!user || points < amount) return false;
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: -amount,
        type: 'redeemed',
        description,
      });
      await supabase
        .from('profiles')
        .update({ points: points - amount })
        .eq('id', user.id);
      setPoints((p) => p - amount);
      await fetchPoints();
      return true;
    },
    [user, points, fetchPoints]
  );

  const validateCoupon = useCallback(
    async (code: string, cartTotal: number, itemsIds: string[] = []): Promise<CouponResult> => {
      if (!code.trim()) return { valid: false, error: 'Ingresa un código' };

      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error || !coupon) return { valid: false, error: 'Código no válido o expirado' };

      // 1. Basic checks
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Este cupón ha expirado' };
      }
      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return { valid: false, error: 'Este cupón ya alcanzó su límite de usos' };
      }
      if (cartTotal < Number(coupon.min_purchase)) {
        return {
          valid: false,
          error: `Compra mínima de ${Number(coupon.min_purchase).toFixed(2)} € requerida`,
        };
      }

      // 2. Advanced constraints (Services / Products)
      if (coupon.applies_to && coupon.applies_to !== 'all') {
        // If target_ids is empty but applies_to is set, it applies to ANY service/product
        if (coupon.target_ids && coupon.target_ids.length > 0) {
          const hasValidItem = itemsIds.some(id => coupon.target_ids.includes(id));
          if (!hasValidItem) {
            return {
              valid: false,
              error: `Este cupón solo es válido para ciertos ${coupon.applies_to === 'services' ? 'servicios' : 'productos'}`,
            };
          }
        }
        
        // Note: Category check could be added here if categories were linked to items
      }

      let discount = 0;
      if (coupon.type === 'percentage') discount = (cartTotal * Number(coupon.value)) / 100;
      else if (coupon.type === 'fixed') discount = Math.min(Number(coupon.value), cartTotal);
      else if (coupon.type === 'points') discount = Math.min(Number(coupon.value) / 100, cartTotal);

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          description: coupon.description,
        },
        discount: Math.round(discount * 100) / 100,
      };
    },
    []
  );

  const applyCouponUse = useCallback(
    async (couponId: string) => {
      const userId = user?.id ?? null;
      await supabase.from('coupon_uses').insert({ coupon_id: couponId, user_id: userId });
      try {
        const { error } = await supabase.rpc('increment_coupon_uses', { coupon_id_param: couponId });
        if (error) throw error;
      } catch (err) {
        // fallback if rpc not available
        supabase
          .from('coupons')
          .select('uses_count')
          .eq('id', couponId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('coupons')
                .update({ uses_count: (data.uses_count ?? 0) + 1 })
                .eq('id', couponId);
            }
          });
      }
    },
    [user]
  );

  return { points, transactions, loading, addPoints, redeemPoints, validateCoupon, applyCouponUse, fetchPoints };
}
