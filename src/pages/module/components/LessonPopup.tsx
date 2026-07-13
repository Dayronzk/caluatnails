import { useState, useEffect, useRef } from 'react';
import { X, Clock, CheckCircle, PlayCircle, FileText, BookOpen } from 'lucide-react';
import type { Lesson } from '@/mocks/courseData';
import { LessonQuiz } from '@/pages/module/components/LessonQuiz';

interface LessonPopupProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isCompleted: boolean;
}

/** Convierte cualquier URL de YouTube a formato embed */
function toEmbedUrl(url: string): string {
  try {
    // ya es embed
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com')) return url;
    // youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // youtube.com/watch?v=ID
    const watchMatch = url.match(/[?&]v=([^?&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    // vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  } catch {
    // ignore
  }
  return url;
}

function isEmbedUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

export function LessonPopup({ lesson, isOpen, onClose, onComplete, isCompleted }: LessonPopupProps) {
  const [hasWatched, setHasWatched] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasWatched(false);
    setHasRead(false);
    setProgress(0);
    setQuizFinished(false);
  }, [lesson.id]);

  // Track video progress (solo para <video> nativo, no iframe)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || lesson.type !== 'video') return;
    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);
      if (percent >= 90) setHasWatched(true);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [lesson.type]);

  // Para iframe (YouTube/Vimeo) marcamos como visto al abrir tras 5 s de gracia
  useEffect(() => {
    if (lesson.type === 'video' && lesson.videoUrl && isEmbedUrl(lesson.videoUrl)) {
      const t = setTimeout(() => {
        setProgress(10);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [lesson.type, lesson.videoUrl]);

  // Track reading progress
  useEffect(() => {
    if (lesson.type !== 'lectura') return;
    const content = contentRef.current;
    if (!content) return;
    const handleScroll = () => {
      const total = content.scrollHeight - content.clientHeight;
      if (total <= 0) { setProgress(100); setHasRead(true); return; }
      const pct = Math.min((content.scrollTop / total) * 100, 100);
      setProgress(pct);
      if (pct >= 80) setHasRead(true);
    };
    // Si el contenido cabe sin scroll, marcar como leído inmediatamente
    setTimeout(() => {
      if (content.scrollHeight <= content.clientHeight) { setProgress(100); setHasRead(true); }
    }, 500);
    content.addEventListener('scroll', handleScroll);
    return () => content.removeEventListener('scroll', handleScroll);
  }, [lesson.type, lesson.content]);

  // Practice / evaluacion: habilitar después de 10s SOLO si no hay preguntas
  useEffect(() => {
    const hasQuestions = lesson.type === 'evaluacion' && lesson.questions && lesson.questions.length > 0;
    if (lesson.type === 'practica' || (lesson.type === 'evaluacion' && !hasQuestions)) {
      const t = setTimeout(() => setHasWatched(true), 10000);
      return () => clearTimeout(t);
    }
  }, [lesson.type, lesson.questions]);

  if (!isOpen) return null;

  const hasEvalQuestions = lesson.type === 'evaluacion' && lesson.questions && lesson.questions.length > 0;

  const canComplete =
    lesson.type === 'video' ? hasWatched :
    lesson.type === 'lectura' ? hasRead :
    lesson.type === 'evaluacion' && hasEvalQuestions ? quizFinished :
    hasWatched;

  const hasVideoUrl = !!lesson.videoUrl;
  const useIframe = hasVideoUrl && isEmbedUrl(lesson.videoUrl!);
  const embedSrc = hasVideoUrl ? toEmbedUrl(lesson.videoUrl!) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              lesson.type === 'video' ? 'bg-rose-100 text-rose-600' :
              lesson.type === 'lectura' ? 'bg-amber-100 text-amber-600' :
              lesson.type === 'practica' ? 'bg-emerald-100 text-emerald-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {lesson.type === 'video' ? <PlayCircle className="w-5 h-5" /> :
               lesson.type === 'lectura' ? <FileText className="w-5 h-5" /> :
               lesson.type === 'practica' ? <BookOpen className="w-5 h-5" /> :
               <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {lesson.type === 'video' ? 'Video' :
                 lesson.type === 'lectura' ? 'Lectura' :
                 lesson.type === 'practica' ? 'Práctica' : 'Evaluación'}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">{lesson.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" /><span>{lesson.duration}</span>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Body */}
        <div ref={contentRef} className="overflow-y-auto max-h-[calc(90vh-180px)]">

          {/* ── VIDEO ── */}
          {lesson.type === 'video' && (
            <div className="aspect-video bg-gray-900">
              {!hasVideoUrl ? (
                /* Sin URL: placeholder */
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60">
                  <PlayCircle className="w-16 h-16" />
                  <p className="text-sm">Video no disponible todavía</p>
                  <p className="text-xs opacity-60">El instructor subirá el video próximamente</p>
                </div>
              ) : useIframe ? (
                /* YouTube / Vimeo */
                <iframe
                  src={embedSrc}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setProgress((p) => Math.max(p, 5))}
                />
              ) : (
                /* Video directo mp4 / etc */
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  src={lesson.videoUrl}
                >
                  Tu navegador no soporta este formato de video.
                </video>
              )}
            </div>
          )}

          <div className="p-6">
            <p className="text-gray-600 mb-6 leading-relaxed">{lesson.description}</p>

            {/* ── LECTURA ── */}
            {lesson.type === 'lectura' && (
              <div className="bg-amber-50 rounded-xl p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Contenido de la lección
                </h4>
                {lesson.content ? (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {lesson.content}
                  </div>
                ) : (
                  <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
                    <p>En esta lección encontrarás los fundamentos esenciales para dominar esta técnica. La práctica constante y la atención a los detalles son clave para alcanzar resultados profesionales.</p>
                    <p>Recuerda que cada mano es diferente, por lo que debes adaptar tu técnica según las necesidades específicas de cada cliente.</p>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-amber-400">
                      <p className="text-sm italic text-gray-600">"La excelencia no es un acto, sino un hábito. Practica cada movimiento hasta que sea natural."</p>
                    </div>
                    <p className="text-amber-700 text-xs">El instructor añadirá el contenido completo próximamente.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PRÁCTICA ── */}
            {lesson.type === 'practica' && (
              <div className="bg-emerald-50 rounded-xl p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Guía de Práctica
                </h4>
                {lesson.content ? (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {lesson.content}
                  </div>
                ) : (
                  <ol className="space-y-3 text-sm">
                    {['Prepara todos los materiales necesarios antes de comenzar',
                      'Desinfecta tu área de trabajo y herramientas',
                      'Sigue los pasos demostrados en el video tutorial',
                      'Practica en tips antes de trabajar en clientes reales',
                      'Documenta tu progreso con fotos para comparar tu mejora'].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* ── EVALUACIÓN ── */}
            {lesson.type === 'evaluacion' && (
              hasEvalQuestions ? (
                <div className="bg-purple-50 rounded-xl overflow-hidden">
                  <LessonQuiz
                    questions={lesson.questions!}
                    lessonTitle={lesson.title}
                    onFinish={() => { setQuizFinished(true); setProgress(100); }}
                  />
                </div>
              ) : (
                <div className="bg-purple-50 rounded-xl p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    Evaluación Teórica
                  </h4>
                  {lesson.content ? (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{lesson.content}</div>
                  ) : (
                    <p className="text-gray-600 text-sm">Esta evaluación pondrá a prueba los conocimientos adquiridos en el módulo. El instructor habilitará el cuestionario próximamente.</p>
                  )}
                </div>
              )
            )}

            {/* Botón para iframe — el usuario tiene que indicar manualmente que vio el video */}
            {lesson.type === 'video' && hasVideoUrl && useIframe && !hasWatched && (
              <button
                onClick={() => { setHasWatched(true); setProgress(100); }}
                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <i className="ri-check-double-line mr-2"></i>
                Ya vi el video — continuar
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            {!canComplete && !isCompleted && lesson.type === 'video' && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                {useIframe ? 'Mira el video y luego haz clic en "Ya vi el video"' : 'Mira el 90% del video para completar'}
              </span>
            )}
            {!canComplete && !isCompleted && lesson.type === 'lectura' && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                Desplázate por el contenido para completar
              </span>
            )}
            {!canComplete && !isCompleted && (lesson.type === 'practica' || (lesson.type === 'evaluacion' && !hasEvalQuestions)) && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Revisa el contenido para habilitar el botón
              </span>
            )}
            {!canComplete && !isCompleted && lesson.type === 'evaluacion' && hasEvalQuestions && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block" />
                Completa la evaluación para continuar
              </span>
            )}
            {(canComplete || isCompleted) && (
              <span className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Lección completada' : '¡Listo para completar!'}
              </span>
            )}
          </div>

          <button
            onClick={onComplete}
            disabled={!canComplete || isCompleted}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
              isCompleted ? 'bg-emerald-100 text-emerald-700 cursor-default' :
              canComplete ? 'bg-rose-500 text-white hover:bg-rose-600' :
              'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCompleted ? '✓ Completada' : 'Marcar como completada'}
          </button>
        </div>
      </div>
    </div>
  );
}
