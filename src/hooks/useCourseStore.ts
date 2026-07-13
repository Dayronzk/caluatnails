import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DBModule, DBLesson, DBLessonTag } from '@/lib/types';
import { modules as mockModules, moduleLessons } from '@/mocks/courseData';
import type { Lesson } from '@/mocks/courseData';

// ─── Seed helper ─────────────────────────────────────────────────────────────

async function seedFromMocks(): Promise<void> {
  try {
    const moduleInserts = mockModules.map((m) => ({
      title: m.title,
      description: m.description,
      duration: m.duration,
      order_index: m.id,
      level: m.level,
      color: m.color,
      icon: m.icon,
    }));

    const { data: insertedMods, error: modErr } = await supabase
      .from('modules')
      .insert(moduleInserts)
      .select('id, order_index');

    if (modErr || !insertedMods) return;

    const modMap = new Map<number, string>(
      insertedMods.map((m: { id: string; order_index: number }) => [m.order_index, m.id]),
    );

    const lessonInserts = moduleLessons.flatMap((ml) =>
      ml.lessons.map((l) => ({
        module_id: modMap.get(ml.id) ?? '',
        title: l.title,
        type: l.type,
        duration: l.duration,
        description: l.description,
        order_index: l.id,
        is_free: l.free,
        video_url: l.videoUrl ?? null,
        content: l.content ?? null,
      })),
    );

    await supabase.from('lessons').insert(lessonInserts);
  } catch {
    // silently fail — mock data will be used as fallback
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCourseStore() {
  const [loading, setLoading] = useState(true);
  const [dbModules, setDbModules] = useState<DBModule[]>([]);
  const [dbLessons, setDbLessons] = useState<DBLesson[]>([]);
  const [dbTags, setDbTags] = useState<DBLessonTag[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const triggerReload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);

      const { data: checkMods } = await supabase.from('modules').select('id').limit(1);
      if (!checkMods || checkMods.length === 0) {
        await seedFromMocks();
      }

      const [{ data: mods }, { data: lsns }, { data: tags }] = await Promise.all([
        supabase.from('modules').select('*').order('order_index'),
        supabase.from('lessons').select('*').order('order_index'),
        supabase.from('lesson_tags').select('*').order('created_at'),
      ]);

      if (!cancelled) {
        setDbModules((mods ?? []) as DBModule[]);
        setDbLessons((lsns ?? []) as DBLesson[]);
        setDbTags((tags ?? []) as DBLessonTag[]);
        setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // ── Read: for student pages ──

  const getLessonsForModule = useCallback(
    (moduleOrderIndex: number): Lesson[] => {
      const mod = dbModules.find((m) => m.order_index === moduleOrderIndex);
      if (!mod) return [];
      return dbLessons
        .filter((l) => l.module_id === mod.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => {
          const tag = l.tag_id ? dbTags.find((t) => t.id === l.tag_id) : undefined;
          return {
            id: l.order_index,
            title: l.title,
            type: l.type as Lesson['type'],
            duration: l.duration ?? '',
            description: l.description ?? '',
            free: l.is_free ?? false,
            videoUrl: l.video_url ?? undefined,
            fileUrl: l.file_url ?? undefined,
            content: l.content ?? undefined,
            tagId: l.tag_id ?? undefined,
            tagName: tag?.name ?? undefined,
            tagColor: tag?.color ?? undefined,
            tagIcon: tag?.icon ?? undefined,
            questions: (l.questions as Lesson['questions']) ?? undefined,
          };
        });
    },
    [dbModules, dbLessons, dbTags],
  );

  const getLessonCountsByModuleOrderIndex = useCallback((): Record<number, number> => {
    const counts: Record<number, number> = {};
    dbModules.forEach((m) => {
      counts[m.order_index] = dbLessons.filter((l) => l.module_id === m.id).length;
    });
    return counts;
  }, [dbModules, dbLessons]);

  // ── Read: for admin ──

  const getAllDBLessonsWithModule = useCallback(
    (): Array<DBLesson & { moduleTitle: string }> =>
      dbLessons.map((l) => ({
        ...l,
        moduleTitle: dbModules.find((m) => m.id === l.module_id)?.title ?? 'Módulo',
      })),
    [dbModules, dbLessons],
  );

  // ── Write: lessons ──

  const saveLesson = useCallback(
    async (moduleId: string, lessonData: Partial<DBLesson> & { id?: string }) => {
      const isExisting = lessonData.id && lessonData.id.includes('-');
      if (isExisting) {
        await supabase.from('lessons').update({
          title: lessonData.title,
          type: lessonData.type,
          duration: lessonData.duration,
          description: lessonData.description,
          video_url: lessonData.video_url ?? null,
          file_url: lessonData.file_url ?? null,
          content: lessonData.content ?? null,
          is_free: lessonData.is_free ?? false,
          tag_id: lessonData.tag_id ?? null,
          questions: lessonData.questions ?? null,
          module_id: moduleId,
          updated_at: new Date().toISOString(),
        }).eq('id', lessonData.id);
      } else {
        const maxIdx = Math.max(0, ...dbLessons.filter((l) => l.module_id === moduleId).map((l) => l.order_index));
        await supabase.from('lessons').insert({
          module_id: moduleId,
          title: lessonData.title,
          type: lessonData.type,
          duration: lessonData.duration,
          description: lessonData.description,
          video_url: lessonData.video_url ?? null,
          file_url: lessonData.file_url ?? null,
          content: lessonData.content ?? null,
          is_free: lessonData.is_free ?? false,
          tag_id: lessonData.tag_id ?? null,
          questions: lessonData.questions ?? null,
          order_index: maxIdx + 1,
        });
      }
      triggerReload();
    },
    [dbLessons, triggerReload],
  );

  const getFreeMaterials = useCallback(
    (): DBLesson[] =>
      dbLessons.filter((l) => l.type === 'material' && l.is_free === true),
    [dbLessons],
  );

  const deleteLesson = useCallback(
    async (lessonId: string) => {
      await supabase.from('lessons').delete().eq('id', lessonId);
      triggerReload();
    },
    [triggerReload],
  );

  // ── Write: modules ──

  const saveModule = useCallback(
    async (moduleData: Partial<DBModule> & { id?: string }) => {
      if (moduleData.id) {
        await supabase.from('modules').update({
          title: moduleData.title,
          description: moduleData.description,
          duration: moduleData.duration,
          level: moduleData.level,
          color: moduleData.color,
          icon: moduleData.icon,
          tag_id: moduleData.tag_id ?? null,
          price: moduleData.price ?? null,
          stripe_product_id: moduleData.stripe_product_id ?? null,
          stripe_price_id: moduleData.stripe_price_id ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', moduleData.id);
      } else {
        const maxIdx = Math.max(0, ...dbModules.map((m) => m.order_index));
        await supabase.from('modules').insert({
          title: moduleData.title,
          description: moduleData.description,
          duration: moduleData.duration,
          level: moduleData.level ?? 'Principiante',
          color: moduleData.color ?? 'rose',
          icon: moduleData.icon ?? 'ri-book-line',
          tag_id: moduleData.tag_id ?? null,
          price: moduleData.price ?? null,
          order_index: maxIdx + 1,
        });
      }
      triggerReload();
    },
    [dbModules, triggerReload],
  );

  const deleteModule = useCallback(
    async (moduleId: string) => {
      await supabase.from('lessons').delete().eq('module_id', moduleId);
      await supabase.from('modules').delete().eq('id', moduleId);
      triggerReload();
    },
    [triggerReload],
  );

  const reorderModules = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) =>
        supabase.from('modules').update({ order_index: idx + 1 }).eq('id', id),
      );
      await Promise.all(updates);
      triggerReload();
    },
    [triggerReload],
  );

  const reorderLessons = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) =>
        supabase.from('lessons').update({ order_index: idx + 1 }).eq('id', id),
      );
      await Promise.all(updates);
      triggerReload();
    },
    [triggerReload],
  );

  const bulkAssignModule = useCallback(
    async (lessonIds: string[], moduleId: string) => {
      await supabase.from('lessons').update({ module_id: moduleId }).in('id', lessonIds);
      triggerReload();
    },
    [triggerReload],
  );

  // ── Write: tags ──

  const saveTag = useCallback(
    async (tagData: Partial<DBLessonTag> & { id?: string }) => {
      if (tagData.id) {
        await supabase.from('lesson_tags').update({
          name: tagData.name,
          color: tagData.color,
          icon: tagData.icon,
          description: tagData.description ?? null,
        }).eq('id', tagData.id);
      } else {
        await supabase.from('lesson_tags').insert({
          name: tagData.name,
          color: tagData.color ?? 'rose',
          icon: tagData.icon ?? 'ri-price-tag-3-line',
          description: tagData.description ?? null,
        });
      }
      triggerReload();
    },
    [triggerReload],
  );

  const deleteTag = useCallback(
    async (tagId: string) => {
      // Unlink lessons from this tag first
      await supabase.from('lessons').update({ tag_id: null }).eq('tag_id', tagId);
      await supabase.from('lesson_tags').delete().eq('id', tagId);
      triggerReload();
    },
    [triggerReload],
  );

  return {
    loading,
    allModules: dbModules,
    allDBLessons: dbLessons,
    allTags: dbTags,
    getLessonsForModule,
    getAllDBLessonsWithModule,
    getLessonCountsByModuleOrderIndex,
    saveLesson,
    deleteLesson,
    getFreeMaterials,
    saveModule,
    deleteModule,
    saveTag,
    deleteTag,
    reorderModules,
    reorderLessons,
    bulkAssignModule,
  };
}
