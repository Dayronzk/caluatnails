import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import {
  Users, Search, Mail, Calendar, Clock, Loader,
  ShoppingBag, TrendingUp, CalendarDays, ExternalLink, Star
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  created_at: string | null;
  bookingCount: number;
  bookingTotal: number;
  purchaseCount: number;
  purchaseTotal: number;
  lastActivity: string | null;
  points: number;
  referral_code: string | null;
  referralCount: number;
  bookings: any[];
  purchases: any[];
  import_source: string | null;
}

type SourceFilter = "all" | "registered" | "imported";

export default function AdminClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "spend" | "recent">("recent");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [topService, setTopService] = useState<{ name: string; count: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });
  const [mergeModal, setMergeModal] = useState<{ open: boolean; c1: Client | null; c2: Client | null }>({ open: false, c1: null, c2: null });
  const [mergeSelection, setMergeSelection] = useState({ name: "", email: "", phone: "", primaryId: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: profiles },
      { data: bookings },
      { data: purchases },
      { data: referrals },
      { data: client_accounts },
      { data: students },
    ] = await Promise.all([
      supabase.from("profiles").select("id, email, name, created_at, points, referral_code"),
      supabase.from("bookings").select("user_id, client_email, client_phone, client_name, total_price, status, created_at, booking_services(service_id, service_name, services:services(reward_points))"),
      supabase.from("purchases").select("email, amount_total, status, created_at, product_id"),
      supabase.from("referrals").select("id, referrer_id, status"),
      supabase.from("client_accounts").select("id, name, phone, email, points, referral_code, import_source, created_at"),
      supabase.from("students").select("id, phone, email, name, created_at"),
    ]);

    // Maps to link identifiers to the same client object
    const emailMap: Record<string, Client> = {};
    const phoneMap: Record<string, Client> = {};
    const clientList: Client[] = [];

    const normalizePhone = (phone?: string | null) => {
      if (!phone) return null;
      // Remove all non-numeric characters
      let cleaned = phone.replace(/\D/g, "");
      // For Spanish numbers, the most reliable part is the last 9 digits
      if (cleaned.length >= 9) {
        cleaned = cleaned.slice(-9);
      }
      return cleaned;
    };

    const getOrCreateClient = (email?: string | null, phone?: string | null, id?: string, name?: string, created?: string) => {
      const eKey = email?.toLowerCase().trim();
      const pKey = normalizePhone(phone);
      const isBusinessEmail = eKey === "caluatnailscom@gmail.com";
      
      // 1. Try to find existing client by system ID, email or phone
      let existing: Client | undefined = 
        (id ? clientList.find(c => c.id === id) : undefined) ||
        (eKey && !isBusinessEmail ? emailMap[eKey] : undefined) || 
        (pKey ? phoneMap[pKey] : undefined);

      if (!existing) {
        // 2. Create new client with a guaranteed unique ID
        const uniqueId = id || eKey || pKey || `temp_${Math.random().toString(36).substr(2, 9)}`;
        existing = {
          id: uniqueId,
          email: eKey || null,
          phone: pKey || null,
          name: name || null,
          created_at: created || null,
          bookingCount: 0,
          bookingTotal: 0,
          purchaseCount: 0,
          purchaseTotal: 0,
          lastActivity: null,
          points: 0,
          referral_code: null,
          referralCount: 0,
          bookings: [],
          purchases: [],
          import_source: null,
        };
        clientList.push(existing);
      }

      // 3. Register identifiers for future lookups (merging)
      if (eKey && !emailMap[eKey]) emailMap[eKey] = existing;
      if (pKey && !phoneMap[pKey]) phoneMap[pKey] = existing;
      
      // Update basic info if missing
      if (!existing.id && id) existing.id = id;
      if (!existing.email && eKey) existing.email = eKey;
      if (!existing.phone && pKey) existing.phone = pKey;
      if (!existing.name && name) existing.name = name;
      if (!existing.created_at && created) existing.created_at = created;

      return existing;
    };

    // 1. Process Profiles
    (profiles ?? []).forEach(p => {
      const c = getOrCreateClient(p.email, null, p.id, p.name || undefined, p.created_at || undefined);
      if (c) {
        c.id = p.id;
        c.name = p.name || c.name;
        c.points = p.points || 0;
        c.referral_code = p.referral_code || null;
      }
    });

    // 2. Process Bookings
    (bookings ?? []).forEach(b => {
      const c = getOrCreateClient(b.client_email, b.client_phone);
      if (!c) return;

      // Almacenamos siempre en historial para el modal
      c.bookings.push(b);

      const bDate = new Date(b.created_at);
      const now = new Date();
      
      // 1. Filtro de Tiempo
      let matchesTime = true;
      if (timeFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (bDate < weekAgo) matchesTime = false;
      } else if (timeFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        if (bDate < monthAgo) matchesTime = false;
      }

      // 2. Filtro de Estado
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(b.status);

      // 3. Filtro de Servicio
      const bServices = (b.booking_services || []).map((bs: any) => bs.service_name).filter(Boolean);
      let matchesService = serviceFilter === "all" || bServices.includes(serviceFilter);

      // Solo si cumple todo, actualizamos estadísticas y nombre
      if (matchesTime && matchesStatus && matchesService) {
        c.bookingCount++;
        if (b.status !== "cancelled") {
          c.bookingTotal += Number(b.total_price) || 0;
        }
        
        // Capturar nombre y actividad reciente
        if (!c.name && b.client_name) c.name = b.client_name;
        if (!c.lastActivity || new Date(b.created_at) > new Date(c.lastActivity)) {
          c.lastActivity = b.created_at;
        }
      }
    });

    // 3. Process Purchases
    (purchases ?? []).forEach(p => {
      const c = getOrCreateClient(p.email);
      if (!c) return;

      // Almacenamos siempre la compra para el historial
      c.purchases.push(p);

      const pDate = new Date(p.created_at);
      const now = new Date();
      
      // Time Filter
      let matchesTime = true;
      if (timeFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (pDate < weekAgo) matchesTime = false;
      } else if (timeFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        if (pDate < monthAgo) matchesTime = false;
      }

      if (matchesTime) {
        if (p.status === "completed") {
          c.purchaseCount++;
          c.purchaseTotal += (p.amount_total || 0) / 100;
        }
        if (!c.lastActivity || new Date(p.created_at) > new Date(c.lastActivity)) {
          c.lastActivity = p.created_at;
        }
      }
    });

    // 4. Process Referrals
    (referrals ?? []).forEach(r => {
      if (!r.referrer_id) return;
      const c = clientList.find(cli => cli.id === r.referrer_id);
      if (c) c.referralCount++;
    });

    // 5. Process Client Accounts (Salon customers)
    (client_accounts ?? []).forEach(acc => {
      const c = getOrCreateClient(acc.email, acc.phone, acc.id, acc.name);
      if (c) {
        if (c.points === 0) c.points = acc.points || 0;
        else if (acc.points > 0 && c.id !== acc.id) c.points += acc.points;
        if (!c.referral_code) c.referral_code = acc.referral_code;
        if (acc.import_source && !c.import_source) c.import_source = acc.import_source;
        if (acc.created_at && !c.created_at) c.created_at = acc.created_at;
      }
    });

    // 5b. Process Students (Academy)
    (students ?? []).forEach(std => {
      getOrCreateClient(std.email, std.phone, std.id, std.name, std.created_at);
    });

    // 6. Analítica de Servicios Populares
    const serviceCounts: Record<string, number> = {};
    const servicesSet = new Set<string>();

    (bookings ?? []).forEach(b => {
      const bDate = new Date(b.created_at);
      const now = new Date();
      
      let tMatch = true;
      if (timeFilter === "week") {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        if (bDate < weekAgo) tMatch = false;
      } else if (timeFilter === "month") {
        const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);
        if (bDate < monthAgo) tMatch = false;
      }
      const sMatch = statusFilters.length === 0 || statusFilters.includes(b.status);

      (b.booking_services || []).forEach((bs: any) => {
        const sName = bs.service_name;
        if (sName) {
          servicesSet.add(sName);
          if (tMatch && sMatch) {
            serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
          }
        }
      });
    });

    const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
    setTopService(sortedServices.length ? { name: sortedServices[0][0], count: sortedServices[0][1] } : null);
    setAvailableServices(Array.from(servicesSet).sort());

    // Mostramos TODOS los clientes registrados para que coincida con campañas
    setClients(clientList);
    setLoading(false);
  }, [statusFilters, timeFilter, serviceFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (singleId?: string) => {
    const idsToDelete = singleId ? [singleId] : selectedIds;
    if (idsToDelete.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar ${idsToDelete.length} cliente(s)? Esta acción borrará sus perfiles, cuentas y TODO su historial de citas y compras para que desaparezcan de la lista.`)) return;

    setIsProcessing(true);
    try {
      // Separate real IDs from temp IDs
      const realIds = idsToDelete.filter(id => id.length > 20 && !id.startsWith("temp_"));
      const tempClients = clients.filter(c => idsToDelete.includes(c.id) && c.id.startsWith("temp_"));

      const deletePromises: any[] = [];
      const allClients = clients.filter(c => idsToDelete.includes(c.id));

      // Delete real records by ID
      if (realIds.length > 0) {
        deletePromises.push(supabase.from("profiles").delete().in("id", realIds));
        deletePromises.push(supabase.from("client_accounts").delete().in("id", realIds));
        deletePromises.push(supabase.from("students").delete().in("id", realIds));
      }

      // Also delete by phone/email to catch cross-table matches
      allClients.forEach(c => {
        if (c.phone) {
          deletePromises.push(supabase.from("client_accounts").delete().ilike("phone", `%${c.phone.slice(-9)}`));
          deletePromises.push(supabase.from("bookings").delete().ilike("client_phone", `%${c.phone.slice(-9)}`));
        }
        if (c.email) {
          deletePromises.push(supabase.from("client_accounts").delete().eq("email", c.email));
          deletePromises.push(supabase.from("bookings").delete().eq("client_email", c.email));
          deletePromises.push(supabase.from("purchases").delete().eq("email", c.email));
        }
      });

      await Promise.all(deletePromises);
      
      alert("Clientes y su historial eliminados correctamente. 🧹");
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Error al eliminar los registros.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMerge = async () => {
    if (selectedIds.length !== 2) return;
    const [id1, id2] = selectedIds;
    
    const c1 = clients.find(c => c.id === id1);
    const c2 = clients.find(c => c.id === id2);

    if (!c1 || !c2) return;

    setMergeSelection({
      name: c1.name || c2.name || "",
      email: c1.email || c2.email || "",
      phone: c1.phone || c2.phone || "",
      primaryId: c1.id
    });
    setMergeModal({ open: true, c1, c2 });
  };

  const executeMerge = async () => {
    const { c1, c2 } = mergeModal;
    if (!c1 || !c2) return;

    setIsProcessing(true);
    try {
      // 1. Find if there's an "official" record in client_accounts for the chosen email/phone
      const { data: existingRecords } = await supabase.from("client_accounts")
        .select("id, email, phone, auth_user_id")
        .or(`email.eq.${mergeSelection.email},phone.eq.${mergeSelection.phone}`);

      // 1.5 Find if either c1.id or c2.id belongs to a real profile (auth user)
      const { data: profileRecords } = await supabase.from("profiles")
        .select("id")
        .in("id", [c1.id, c2.id].filter(id => id && id.length > 20));
      
      let profileId = profileRecords?.[0]?.id || null;
      if (!profileId && existingRecords) {
        profileId = existingRecords.find(r => r.auth_user_id)?.auth_user_id || null;
      }

      // 2. Determine the REAL primary ID (prefer an existing UUID from DB)
      let finalPrimaryId = "";
      const dbRecord = existingRecords?.[0];
      
      if (dbRecord) {
        finalPrimaryId = dbRecord.id;
      } else if (c1.id.length > 20 && !c1.id.startsWith("temp_") && !c1.id.startsWith("std_")) {
        finalPrimaryId = c1.id;
      } else if (c2.id.length > 20 && !c2.id.startsWith("temp_") && !c2.id.startsWith("std_")) {
        finalPrimaryId = c2.id;
      }

      // 2.5. Nullify email, phone, and referral_code on secondary client accounts to avoid unique constraint violations
      const allRealIds = [c1.id, c2.id].filter(id => id && id.length > 20 && !id.startsWith("temp_") && !id.startsWith("std_"));
      const secondaryIds = Array.from(new Set([
        ...allRealIds,
        ...(existingRecords?.map(r => r.id) || [])
      ])).filter(id => id !== finalPrimaryId);

      if (secondaryIds.length > 0) {
        const { error: nullifyErr } = await supabase.from("client_accounts")
          .update({ email: null, phone: null, referral_code: null })
          .in("id", secondaryIds);
        if (nullifyErr) throw nullifyErr;
      }

      // 3. Update or Create the official primary record
      const primaryData = {
        name: mergeSelection.name,
        email: mergeSelection.email || null,
        phone: mergeSelection.phone || null,
        points: (c1.points || 0) + (c2.points || 0),
        auth_user_id: profileId,
        referral_code: c1.referral_code || c2.referral_code || null
      };

      let upserted: any;
      const isRealId = finalPrimaryId && finalPrimaryId.length > 20 && !finalPrimaryId.startsWith("temp_") && !finalPrimaryId.startsWith("std_");
      const existsInClientAccounts = existingRecords?.some(r => r.id === finalPrimaryId);

      if (isRealId && existsInClientAccounts) {
        const { data, error } = await supabase.from("client_accounts").update(primaryData).eq("id", finalPrimaryId).select().single();
        if (error) throw error;
        upserted = data;
      } else {
        const insertData: any = { ...primaryData };
        if (isRealId) {
          insertData.id = finalPrimaryId;
        }
        const { data, error } = await supabase.from("client_accounts").insert(insertData).select().single();
        if (error) throw error;
        upserted = data;
      }

      if (!upserted) throw new Error("Could not create/update primary record");

      // 4. Transfer all history to the NEW unified primary
      const allOldEmails = [c1.email, c2.email].filter(e => e && e !== mergeSelection.email) as string[];
      const allOldPhones = [c1.phone, c2.phone].filter(p => p && p !== mergeSelection.phone) as string[];
      const idsToTransfer = Array.from(new Set([c1.id, c2.id, ...secondaryIds])).filter(id => id !== upserted.id);

      const bookingFilters = [
        ...allOldEmails.map(e => `client_email.eq.${e}`),
        ...allOldPhones.map(p => `client_phone.eq.${p}`),
        ...idsToTransfer.map(id => `user_id.eq.${id}`)
      ];

      const historyUpdates = [];
      
      // Update ALL bookings of either client to the NEW primary identity
      if (bookingFilters.length > 0) {
        const bookingUpdates: any = {
          client_email: mergeSelection.email || null,
          client_phone: mergeSelection.phone || null
        };
        if (profileId) {
          bookingUpdates.user_id = profileId;
        }
        historyUpdates.push(
          supabase.from("bookings").update(bookingUpdates).or(bookingFilters.join(","))
        );
      }

      // Update ALL purchases
      const purchaseFilters = allOldEmails.map(e => `email.eq.${e}`);
      if (purchaseFilters.length > 0) {
        historyUpdates.push(
          supabase.from("purchases").update({
            email: mergeSelection.email || null
          }).or(purchaseFilters.join(","))
        );
      }

      // Transfer points transactions, referrals, push subscriptions, and notification logs
      if (idsToTransfer.length > 0) {
        historyUpdates.push(
          supabase.from("client_points_transactions")
            .update({ client_account_id: upserted.id })
            .in("client_account_id", idsToTransfer)
        );
        historyUpdates.push(
          supabase.from("client_referrals")
            .update({ referrer_account_id: upserted.id })
            .in("referrer_account_id", idsToTransfer)
        );
        historyUpdates.push(
          supabase.from("push_subscriptions")
            .update({ client_account_id: upserted.id })
            .in("client_account_id", idsToTransfer)
        );
        historyUpdates.push(
          supabase.from("notification_logs")
            .update({ client_account_id: upserted.id })
            .in("client_account_id", idsToTransfer)
        );
      }

      // Update profiles points if profileId is present
      if (profileId) {
        historyUpdates.push(
          supabase.from("profiles")
            .update({ points: upserted.points || 0 })
            .eq("id", profileId)
        );
      }

      await Promise.all(historyUpdates);

      // 5. Cleanup: Delete secondary records that are NOT our new primary
      const deletePromises = [];
      const idsToDelete = Array.from(new Set([...allRealIds, ...secondaryIds])).filter(id => id && id.length > 20);

      idsToDelete.forEach(id => {
        // Never delete the active auth profile
        if (id !== profileId) {
          deletePromises.push(supabase.from("profiles").delete().eq("id", id));
          deletePromises.push(supabase.from("students").delete().eq("id", id));
        }
        // Never delete the primary client account
        if (id !== upserted.id) {
          deletePromises.push(supabase.from("client_accounts").delete().eq("id", id));
        }
      });
      
      await Promise.allSettled(deletePromises);

      alert("¡Fusión inteligente completada! Los datos han sido unificados sin conflictos. ✨");
      setMergeModal({ open: false, c1: null, c2: null });
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error("Merge Error:", err);
      alert("Error crítico en la fusión. Por favor, verifica que el email o teléfono no pertenezcan a una tercera persona.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);
    try {
      const updates = {
        name: editForm.name.trim() || null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null
      };

      const oldPhone = selectedClient.phone;
      const oldEmail = selectedClient.email;
      const last9Old = oldPhone ? oldPhone.replace(/\D/g, "").slice(-9) : null;

      // 1. Find the actual client_accounts row by current phone or email
      let caRow: { id: string } | null = null;
      if (last9Old) {
        const { data } = await supabase.from("client_accounts").select("id").ilike("phone", `%${last9Old}`).maybeSingle();
        caRow = data;
      }
      if (!caRow && oldEmail) {
        const { data } = await supabase.from("client_accounts").select("id").eq("email", oldEmail).maybeSingle();
        caRow = data;
      }

      const promises = [];
      let hasError = false;

      // 2. Update client_accounts
      if (caRow) {
        promises.push(supabase.from("client_accounts").update(updates).eq("id", caRow.id));
      } else if (updates.email || updates.phone) {
        promises.push(supabase.from("client_accounts").insert(updates));
      }

      // 3. Update profiles if this is an auth user
      const isAuthUser = selectedClient.id.length > 20 && !selectedClient.id.startsWith("std_") && !selectedClient.id.startsWith("temp_");
      if (isAuthUser) {
        promises.push(supabase.from("profiles").update({ name: updates.name, phone: updates.phone, email: updates.email }).eq("id", selectedClient.id));
      }

      // 4. Cascading Updates: Sync booking/purchase history
      if (oldEmail && oldEmail !== updates.email) {
        promises.push(supabase.from("bookings").update({ client_email: updates.email }).eq("client_email", oldEmail));
        promises.push(supabase.from("purchases").update({ email: updates.email }).eq("email", oldEmail));
      }
      if (last9Old && updates.phone) {
        const last9New = updates.phone.replace(/\D/g, "").slice(-9);
        if (last9Old !== last9New) {
          promises.push(supabase.from("bookings").update({ client_phone: updates.phone }).ilike("client_phone", `%${last9Old}`));
        }
      }

      const results = await Promise.all(promises);
      for (const r of results) {
        if (r.error) {
          console.error("Update error:", r.error);
          hasError = true;
        }
      }

      if (hasError) {
        alert("Error al actualizar. Verifica que el nuevo email/teléfono no pertenezcan a otro cliente.");
      } else {
        alert("¡Cliente actualizado! ✨");
      }
      setIsEditing(false);
      loadData();
      setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error al actualizar. Verifica que el nuevo email/teléfono no pertenezcan a otro cliente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesText = (c.name ?? "").toLowerCase().includes(q) ||
           (c.email ?? "").toLowerCase().includes(q) ||
           (c.phone ?? "").toLowerCase().includes(q);
    if (!matchesText) return false;
    if (sourceFilter === "imported" && !c.import_source) return false;
    if (sourceFilter === "registered" && c.import_source) return false;

    // Filter by booking status if any are selected
    if (statusFilters.length > 0) {
      const hasNoBookingsFilter = statusFilters.includes("no_bookings");
      const clientBookings = c.bookings || [];

      // Check if client has any booking that matches BOTH the status filters and the time/service filters
      const matchesBookingStatus = clientBookings.some(b => {
        const matchesStatus = statusFilters.includes(b.status);
        if (!matchesStatus) return false;

        // Matches time filter
        let matchesTime = true;
        const bDate = new Date(b.created_at);
        const now = new Date();
        if (timeFilter === "week") {
          const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
          if (bDate < weekAgo) matchesTime = false;
        } else if (timeFilter === "month") {
          const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);
          if (bDate < monthAgo) matchesTime = false;
        }
        if (!matchesTime) return false;

        // Matches service filter
        const bServices = (b.booking_services || []).map((bs: any) => bs.service_name).filter(Boolean);
        const matchesService = serviceFilter === "all" || bServices.includes(serviceFilter);
        if (!matchesService) return false;

        return true;
      });

      const matchesNoBookings = hasNoBookingsFilter && clientBookings.length === 0;

      if (!matchesBookingStatus && !matchesNoBookings) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "spend") return (b.bookingTotal + b.purchaseTotal) - (a.bookingTotal + a.purchaseTotal);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
  });

  const activeInFilter = filtered.filter(c => c.bookingCount > 0 || c.purchaseCount > 0);

  const stats = {
    total: filtered.length,
    activeCount: activeInFilter.length,
    totalSpend: filtered.reduce((acc, c) => acc + c.bookingTotal + c.purchaseTotal, 0),
    avgSpend: activeInFilter.length 
      ? activeInFilter.reduce((acc, c) => acc + c.bookingTotal + c.purchaseTotal, 0) / activeInFilter.length 
      : 0,
    totalBookings: filtered.reduce((acc, c) => acc + c.bookingCount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500 mt-1">Personas que han reservado servicios o comprado en la tienda</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-right-4">
                <span className="text-xs font-bold text-gray-400 uppercase">{selectedIds.length} seleccionados</span>
                {selectedIds.length === 2 && (
                  <button 
                    onClick={handleMerge}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <i className="ri-merge-cells-horizontal text-sm"></i> Combinar
                  </button>
                )}
                <button 
                  onClick={() => handleDelete()}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-lg shadow-black/20 cursor-pointer disabled:opacity-50"
                >
                  <i className="ri-delete-bin-line text-sm"></i> Eliminar
                </button>
              </div>
            )}
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-gray-900">{stats.total}</span>
                <span className="text-gray-500 text-sm">clientes totales</span>
              </div>
              {stats.activeCount !== stats.total && (
                <span className="text-[10px] text-rose-400 font-medium">{stats.activeCount} con actividad en filtro</span>
              )}
            </div>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-rose-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Ingresos Totales (Clientes)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSpend.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-semibold">Promedio por Cliente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSpend.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
              <CalendarDays className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Reservas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3 mb-2 text-rose-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Servicio Estrella</span>
            </div>
            <p className="text-lg font-bold text-gray-900 leading-tight" title={topService?.name || "N/A"}>
              {topService?.name || "Sin datos"}
            </p>
            <p className="text-xs text-gray-400 mt-1">{topService?.count || 0} veces solicitado</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-rose-400 cursor-pointer"
            >
              <option value="recent">Actividad reciente</option>
              <option value="spend">Mayor gasto</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-rose-400 cursor-pointer font-semibold text-rose-600"
            >
              <option value="all">Todo el historial</option>
              <option value="month">Últimos 30 días</option>
              <option value="week">Últimos 7 días</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-rose-400 cursor-pointer font-semibold text-emerald-600"
            >
              <option value="all">Todos los servicios</option>
              {availableServices.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-rose-400 cursor-pointer font-semibold text-indigo-600"
              title="Filtra por origen del cliente"
            >
              <option value="all">Todos los orígenes</option>
              <option value="registered">Solo registrados</option>
              <option value="imported">📥 Solo importados</option>
            </select>
          </div>

          {/* Status Multi-select Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2">Filtrar Reservas por:</span>
            {[
              { id: "completed", label: "Completadas", color: "bg-emerald-500" },
              { id: "confirmed", label: "Confirmadas", color: "bg-blue-500" },
              { id: "pending", label: "Pendientes", color: "bg-amber-500" },
              { id: "cancelled", label: "Canceladas", color: "bg-red-500" },
              { id: "no_bookings", label: "Sin Reservar", color: "bg-slate-500" },
            ].map((f) => {
              const isActive = statusFilters.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setStatusFilters(prev => 
                      prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                    );
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isActive 
                      ? `${f.color} text-white border-transparent shadow-sm` 
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : f.color}`} />
                  {f.label}
                </button>
              );
            })}
            {statusFilters.length > 0 && (
              <button 
                onClick={() => setStatusFilters([])}
                className="text-xs text-gray-400 hover:text-rose-500 underline ml-2 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center">
              <Loader className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Cargando base de datos de clientes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 w-10 text-center">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(filtered.map(c => c.id).filter(Boolean));
                          else setSelectedIds([]);
                        }}
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                      />
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Cliente</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Actividad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservas</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fidelidad</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Referidos</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Gastado</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((client) => (
                    <tr key={client.email || client.phone || client.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(client.id) ? 'bg-rose-50/50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, client.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== client.id));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                            {(client.name || client.email || "??").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-gray-900">{client.name || "Sin nombre"}</p>
                              {client.import_source && (
                                <span
                                  title={`Cliente importado (${client.import_source})`}
                                  className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded uppercase tracking-wider"
                                >
                                  📥 Importado
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {client.email && !client.email.toLowerCase().includes("caluatnailscom") && (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <Mail className="w-3.5 h-3.5" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <i className="ri-smartphone-line text-[10px]"></i>
                                  </div>
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {client.lastActivity 
                              ? `Última vez: ${new Date(client.lastActivity).toLocaleDateString("es-ES")}`
                              : "Sin actividad registrada"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">{client.bookingCount}</span>
                        <p className="text-[10px] text-gray-400">{client.bookingTotal.toFixed(2)} €</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{client.points} pts</span>
                          <span className="text-[10px] text-rose-400 font-medium uppercase tracking-tight">Saldo actual</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`p-1 rounded-md ${client.referralCount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Users className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{client.referralCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-gray-900">{(client.bookingTotal + client.purchaseTotal).toFixed(2)} €</span>
                          <div className="flex gap-2 text-[10px] text-gray-400">
                            <span>Serv: {client.bookingTotal.toFixed(0)}€</span>
                            <span>Shop: {client.purchaseTotal.toFixed(0)}€</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedClient(client)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Ver detalles"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <i className="ri-delete-bin-line w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl font-bold">
                  {(selectedClient.name || selectedClient.email || "??").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="text-xl font-bold text-gray-900 border-b-2 border-rose-500 outline-none w-full bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={editForm.phone}
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        className="text-xs text-gray-500 border-b border-gray-200 outline-none w-full bg-transparent"
                        placeholder="Teléfono"
                      />
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                        className="text-xs text-rose-400 border-b border-gray-200 outline-none w-full bg-transparent"
                        placeholder="Email"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-gray-900">{selectedClient.name || "Sin nombre"}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {selectedClient.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="w-3.5 h-3.5 text-rose-400" />
                            {selectedClient.email}
                          </div>
                        )}
                        {selectedClient.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <i className="ri-smartphone-line text-rose-400"></i>
                            {selectedClient.phone}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Reservas</p>
                  <p className="text-xl font-bold text-gray-900">{selectedClient.bookings.length}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Inversión Servicios</p>
                  <p className="text-xl font-bold text-rose-600">
                    {selectedClient.bookings
                      .filter(b => b.status !== "cancelled")
                      .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)
                      .toFixed(2)} €
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Compras</p>
                  <p className="text-xl font-bold text-gray-900">{selectedClient.purchases.length}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Inversión Tienda</p>
                  <p className="text-xl font-bold text-emerald-600">{selectedClient.purchaseTotal.toFixed(2)} €</p>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-gray-900">Historial de Reservas</h3>
                </div>
                {selectedClient.bookings.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No hay reservas registradas.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.bookings.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((b, i) => (
                      <div key={i} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {b.booking_services?.[0]?.service_name || "Servicio"}
                              {b.booking_services?.length > 1 && ` (+${b.booking_services.length - 1})`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(b.created_at).toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                            b.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-600" />
                              <span>+{(b.booking_services || []).reduce((acc: number, bs: any) => acc + (bs.services?.reward_points || 0), 0)} pts</span>
                            </div>
                            <span className="text-gray-400 text-xs italic">
                              {b.booking_services?.[0]?.service_name}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900">{Number(b.total_price).toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase History */}
              {selectedClient.purchases.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-gray-900">Historial de Compras</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedClient.purchases.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p, i) => (
                      <div key={i} className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900">Compra #{p.product_id?.slice(-4) || 'WEB'}</p>
                            <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString("es-ES")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">{(p.amount_total / 100).toFixed(2)} €</p>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{p.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-rose-500 text-white rounded-full font-bold text-sm hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditForm({ 
                        name: selectedClient.name || "", 
                        phone: selectedClient.phone || "",
                        email: selectedClient.email || ""
                      });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 text-rose-500 font-bold text-sm hover:text-rose-600 transition-colors"
                  >
                    <i className="ri-edit-line"></i> Editar Datos
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Merge Modal */}
      {mergeModal.open && mergeModal.c1 && mergeModal.c2 && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Combinar Clientes</h2>
                <p className="text-sm text-gray-500">Selecciona los datos que deseas mantener en la ficha final</p>
              </div>
              <button onClick={() => setMergeModal({ open: false, c1: null, c2: null })} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-all shadow-sm">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[mergeModal.c1, mergeModal.c2].map((c, idx) => (
                  <button 
                    key={c.id}
                    onClick={() => setMergeSelection(prev => ({ ...prev, primaryId: c.id }))}
                    className={`p-6 rounded-[24px] border-2 transition-all text-left relative ${
                      mergeSelection.primaryId === c.id ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        mergeSelection.primaryId === c.id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {idx === 0 ? 'A' : 'B'}
                      </div>
                      {mergeSelection.primaryId === c.id && <i className="ri-checkbox-circle-fill text-rose-500 text-xl"></i>}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cuenta {mergeSelection.primaryId === c.id ? 'Principal' : 'Secundaria'}</p>
                    <p className="font-bold text-gray-900 truncate">{c.name || "Sin nombre"}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-[24px] p-6 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Selector de Datos a Conservar</h3>
                
                {/* Name Selector */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-500 ml-2">NOMBRE</p>
                  <div className="flex gap-2">
                    {[mergeModal.c1, mergeModal.c2].map(c => (
                      <button 
                        key={`${c.id}-name`}
                        onClick={() => setMergeSelection(prev => ({ ...prev, name: c.name || "" }))}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                          mergeSelection.name === c.name ? 'bg-white border-rose-500 text-rose-600 shadow-sm' : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {c.name || "---"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Selector */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-500 ml-2">EMAIL</p>
                  <div className="flex gap-2">
                    {[mergeModal.c1, mergeModal.c2].map(c => (
                      <button 
                        key={`${c.id}-email`}
                        onClick={() => setMergeSelection(prev => ({ ...prev, email: c.email || "" }))}
                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                          mergeSelection.email === c.email ? 'bg-white border-rose-500 text-rose-600 shadow-sm' : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {c.email || "---"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Selector */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-500 ml-2">TELÉFONO</p>
                  <div className="flex gap-2">
                    {[mergeModal.c1, mergeModal.c2].map(c => (
                      <button 
                        key={`${c.id}-phone`}
                        onClick={() => setMergeSelection(prev => ({ ...prev, phone: c.phone || "" }))}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                          mergeSelection.phone === c.phone ? 'bg-white border-rose-500 text-rose-600 shadow-sm' : 'bg-gray-100 border-transparent text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {c.phone || "---"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-[20px] border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <i className="ri-information-line text-xl"></i>
                </div>
                <div className="text-[11px] text-emerald-800 leading-relaxed">
                  Se sumarán <strong>{(mergeModal.c1.points || 0) + (mergeModal.c2.points || 0)} puntos</strong> y se unificarán todas las reservas de ambos perfiles bajo la cuenta principal elegida.
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setMergeModal({ open: false, c1: null, c2: null })}
                className="flex-1 py-4 bg-white text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={executeMerge}
                disabled={isProcessing}
                className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-gray-900/20 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Procesando Fusión...' : 'Confirmar Fusión ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
