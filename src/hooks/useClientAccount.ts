import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ClientAccount {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  points: number;
  referral_code: string | null;
  auth_user_id: string | null;
  phone_login_enabled: boolean;
  birthday: string | null;
  push_points_awarded: boolean;
  email_reward_awarded: boolean;
  birthday_reward_awarded: boolean;
  google_review_reward_awarded: boolean;
  created_at: string;
}

export interface ClientPointsTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export function useClientAccount(phone?: string, authUserId?: string) {
  const [account, setAccount] = useState<ClientAccount | null>(null);
  const [transactions, setTransactions] = useState<ClientPointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!phone && !authUserId) { setLoading(false); return; }
    setLoading(true);

    let query = supabase.from("client_accounts").select("*");
    if (phone) {
      query = query.eq("phone", phone);
    } else {
      query = query.eq("auth_user_id", authUserId!);
    }
    const { data: acc } = await query.maybeSingle();

    if (acc) {
      setAccount(acc as ClientAccount);
      const { data: txs } = await supabase
        .from("client_points_transactions")
        .select("*")
        .eq("client_account_id", acc.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setTransactions((txs ?? []) as ClientPointsTransaction[]);
    } else {
      setAccount(null);
      setTransactions([]);
    }
    setLoading(false);
  }, [phone, authUserId]);

  useEffect(() => { load(); }, [load]);

  const addPoints = useCallback(async (amount: number, description: string, type = "earned", referenceId?: string) => {
    if (!account) return;
    await supabase.from("client_points_transactions").insert({
      client_account_id: account.id,
      points: amount,
      type,
      description,
      reference_id: referenceId ?? null,
    });
    await supabase
      .from("client_accounts")
      .update({ points: (account.points ?? 0) + amount, updated_at: new Date().toISOString() })
      .eq("id", account.id);
    await load();
  }, [account, load]);

  const redeemPoints = useCallback(async (amount: number, description: string): Promise<boolean> => {
    if (!account || account.points < amount) return false;
    await supabase.from("client_points_transactions").insert({
      client_account_id: account.id,
      points: -amount,
      type: "redeemed",
      description,
    });
    await supabase
      .from("client_accounts")
      .update({ points: account.points - amount, updated_at: new Date().toISOString() })
      .eq("id", account.id);
    await load();
    return true;
  }, [account, load]);

  return { account, transactions, loading, addPoints, redeemPoints, reload: load };
}

export class EmailTakenError extends Error {
  constructor(message = "Este email ya está en uso por otra cuenta.") {
    super(message);
    this.name = "EmailTakenError";
  }
}

export async function ensureClientAccount(phone: string, name?: string, email?: string): Promise<ClientAccount> {
  const normalized = phone.replace(/\s/g, "");

  // Try RPC first to find any existing account regardless of phone format (spaces, country code, etc.)
  const { data: viaRpc } = await supabase
    .rpc("find_client_account_by_phone", { p_phone: phone })
    .maybeSingle();

  const existing = viaRpc as ClientAccount | null;

  if (existing) {
    if (name && !existing.name) {
      await supabase.from("client_accounts").update({ name, updated_at: new Date().toISOString() }).eq("id", existing.id);
      return { ...existing, name } as ClientAccount;
    }
    return existing;
  }

  // If we have an email, make sure it's not already linked to another account/profile.
  if (email && email.trim()) {
    const { data: taken } = await supabase
      .rpc("is_email_taken", { p_email: email.trim(), p_phone: phone });
    if (taken === true) {
      throw new EmailTakenError();
    }
  }

  const id = crypto.randomUUID();
  const referral_code = "NAILOX-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const { data: created, error: insertErr } = await supabase
    .from("client_accounts")
    .insert({ id, phone: normalized, name: name ?? null, email: email?.trim() || null, referral_code })
    .select()
    .single();

  if (insertErr) {
    // Postgres unique_violation maps to error code 23505
    if (insertErr.code === "23505") {
      if (insertErr.message.includes("phone")) {
        throw new Error("Este teléfono ya está en uso por otra cuenta.");
      }
      if (insertErr.message.includes("email")) {
        throw new EmailTakenError();
      }
    }
    throw insertErr;
  }

  return created as ClientAccount;
}
