import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DBLesson, DBModule } from '@/lib/types';

const STORAGE_KEY = 'nail_course_progress_v2';

type ProgressMap = Record<number, number[]>;

const loadProgress = (): ProgressMap => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ProgressMap) : {};
  } catch {
    return {};
  }
};

const saveProgress = (progress: ProgressMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
};

interface ProgressDBContext {
  userId: string;
  dbLessons: DBLesson[];
  dbModules: DBModule[];
}

/**
 * lessonCounts: map of moduleOrderIndex → number of lessons in that module
 * dbContext: optional Supabase sync context (userId + DB data)
 */
export function useProgress(
  lessonCounts: Record<number, number> = {},
  dbContext?: ProgressDBContext,
) {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [synced, setSynced] = useState(false);

  // Load progress from Supabase on mount when authenticated
  useEffect(() => {
    if (!dbContext?.userId || synced) return;
    // Wait until DB data is actually loaded
    if (!dbContext.dbModules.length || !dbContext.dbLessons.length) return;

    const loadFromDB = async () => {
      const { data } = await supabase
        .from('student_progress')
        .select('lesson_id, module_id, completed')
        .eq('student_id', dbContext.userId)
        .eq('completed', true);

      // Build progress map strictly from DB data (source of truth)
      const dbProgress: ProgressMap = {};

      if (data && data.length > 0) {
        data.forEach((row: { lesson_id: string; module_id: string }) => {
          const mod = dbContext.dbModules.find(m => m.id === row.module_id);
          const lesson = dbContext.dbLessons.find(
            l => l.id === row.lesson_id && l.module_id === row.module_id,
          );
          if (mod && lesson) {
            if (!dbProgress[mod.order_index]) dbProgress[mod.order_index] = [];
            if (!dbProgress[mod.order_index].includes(lesson.order_index)) {
              dbProgress[mod.order_index].push(lesson.order_index);
            }
          }
        });
      }

      // DB is the source of truth when authenticated — overwrite localStorage
      setProgress(dbProgress);
      saveProgress(dbProgress);
      setSynced(true);
    };

    loadFromDB();
  }, [dbContext?.userId, synced, dbContext?.dbModules, dbContext?.dbLessons]);

  const totalLessons = Object.values(lessonCounts).reduce((s, n) => s + n, 0);

  // Only count completed lessons from modules that currently exist in lessonCounts
  // and cap each module to its real lesson count (prevents stale localStorage data
  // from inflating the percentage or breaking the 100% check)
  const completedLessons = Object.entries(progress).reduce((s, [key, ids]) => {
    const modIdx = parseInt(key, 10);
    const total = lessonCounts[modIdx];
    if (total === undefined || total === 0) return s; // module no longer exists or has no lessons
    return s + Math.min(ids.length, total);
  }, 0);

  const totalPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCourseComplete = totalLessons > 0 && completedLessons >= totalLessons;

  const getModuleCompleted = useCallback(
    (moduleId: number): Set<number> => new Set(progress[moduleId] ?? []),
    [progress],
  );

  const toggleLesson = useCallback(
    (moduleOrderIndex: number, lessonOrderIndex: number) => {
      setProgress((prev) => {
        const moduleSet = new Set(prev[moduleOrderIndex] ?? []);
        const wasCompleted = moduleSet.has(lessonOrderIndex);
        if (wasCompleted) {
          moduleSet.delete(lessonOrderIndex);
        } else {
          moduleSet.add(lessonOrderIndex);
        }
        const next = { ...prev, [moduleOrderIndex]: Array.from(moduleSet) };
        saveProgress(next);

        // Sync to Supabase if auth context available
        if (dbContext?.userId) {
          const { userId, dbLessons, dbModules } = dbContext;
          const mod = dbModules.find(m => m.order_index === moduleOrderIndex);
          const lesson = dbLessons.find(
            l => l.module_id === mod?.id && l.order_index === lessonOrderIndex,
          );
          if (mod && lesson) {
            if (!wasCompleted) {
              supabase
                .from('student_progress')
                .upsert(
                  {
                    student_id: userId,
                    lesson_id: lesson.id,
                    module_id: mod.id,
                    completed: true,
                    completed_at: new Date().toISOString(),
                  },
                  { onConflict: 'student_id,lesson_id' },
                )
                .then(() => {});
            } else {
              supabase
                .from('student_progress')
                .delete()
                .eq('student_id', userId)
                .eq('lesson_id', lesson.id)
                .then(() => {});
            }
          }
        }

        return next;
      });
    },
    [dbContext],
  );

  const getModulePercentage = useCallback(
    (moduleId: number): number => {
      const total = lessonCounts[moduleId] ?? 0;
      if (total === 0) return 0;
      // Cap completed to total to guard against stale progress data
      const completed = Math.min((progress[moduleId] ?? []).length, total);
      return Math.round((completed / total) * 100);
    },
    [progress, lessonCounts],
  );

  const getModuleCompletedCount = useCallback(
    (moduleId: number): number => {
      const total = lessonCounts[moduleId] ?? 0;
      return Math.min((progress[moduleId] ?? []).length, total);
    },
    [progress, lessonCounts],
  );

  return {
    progress,
    totalPercentage,
    completedLessons,
    totalLessons,
    isCourseComplete,
    getModuleCompleted,
    toggleLesson,
    getModulePercentage,
    getModuleCompletedCount,
  };
}
