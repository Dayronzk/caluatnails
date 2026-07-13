import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  completedLessons: number;
  totalLessons: number;
  totalModules: number;
  totalHours: string;
}

const MAX_NAME_CHANGES = 2;
const COURSE_TITLE = 'Profesional en Manicura y Pedicura';
const ACADEMY_NAME = 'NAILOX';

// ── LocalStorage helpers ──────────────────────────────────────────────────────

function getNameKey(userId: string) { return `cert_name_${userId}`; }
function getChangesKey(userId: string) { return `cert_name_changes_${userId}`; }
function getCertIdKey(userId: string) { return `cert_id_${userId}`; }

function getSavedName(userId: string): string {
  try { return localStorage.getItem(getNameKey(userId)) ?? ''; } catch { return ''; }
}
function saveName(userId: string, name: string) {
  try { localStorage.setItem(getNameKey(userId), name); } catch { /* ignore */ }
}
function getChangesCount(userId: string): number {
  try { return parseInt(localStorage.getItem(getChangesKey(userId)) ?? '0', 10); } catch { return 0; }
}
function incrementChanges(userId: string): number {
  try {
    const next = getChangesCount(userId) + 1;
    localStorage.setItem(getChangesKey(userId), String(next));
    return next;
  } catch { return 1; }
}
function getSavedCertId(userId: string): string {
  try { return localStorage.getItem(getCertIdKey(userId)) ?? ''; } catch { return ''; }
}
function saveCertId(userId: string, certId: string) {
  try { localStorage.setItem(getCertIdKey(userId), certId); } catch { /* ignore */ }
}

// ── Certificate config ────────────────────────────────────────────────────────

interface CertConfig {
  academy_name: string;
  course_title: string;
}

const DEFAULT_CONFIG: CertConfig = {
  academy_name: ACADEMY_NAME,
  course_title: COURSE_TITLE,
};

// ── Canvas draw ───────────────────────────────────────────────────────────────

export function drawCertificateCanvas(
  canvas: HTMLCanvasElement,
  studentName: string,
  cfg: CertConfig,
  completedLessons: number,
  totalModules: number,
  totalHours: string,
  certId?: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // ── Modern gradient background ───────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(0.5, '#16213e');
  bg.addColorStop(1, '#0f3460');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Subtle geometric pattern ─────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, H);
    ctx.stroke();
  }
  for (let i = 0; i < H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(W, i);
    ctx.stroke();
  }

  // ── Main card with glass effect ──────────────────────────────────────────
  const cardX = 60;
  const cardY = 40;
  const cardW = W - 120;
  const cardH = H - 80;
  const cornerR = 24;

  // Card shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  // Card background
  const cardBg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardBg.addColorStop(0, 'rgba(255,255,255,0.98)');
  cardBg.addColorStop(1, 'rgba(255,255,255,0.95)');
  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.moveTo(cardX + cornerR, cardY);
  ctx.lineTo(cardX + cardW - cornerR, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cornerR);
  ctx.lineTo(cardX + cardW, cardY + cardH - cornerR);
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cornerR, cardY + cardH);
  ctx.lineTo(cardX + cornerR, cardY + cardH);
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cornerR);
  ctx.lineTo(cardX, cardY + cornerR);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cornerR, cardY);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ── Top accent bar ───────────────────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  accentGrad.addColorStop(0, '#e11d48');
  accentGrad.addColorStop(0.5, '#fb7185');
  accentGrad.addColorStop(1, '#e11d48');
  ctx.fillStyle = accentGrad;
  ctx.beginPath();
  ctx.moveTo(cardX + cornerR, cardY);
  ctx.lineTo(cardX + cardW - cornerR, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cornerR);
  ctx.lineTo(cardX + cardW, cardY + 6);
  ctx.lineTo(cardX, cardY + 6);
  ctx.lineTo(cardX, cardY + cornerR);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cornerR, cardY);
  ctx.closePath();
  ctx.fill();

  // ── Academy logo area ────────────────────────────────────────────────────
  const centerX = cardX + cardW / 2;
  const contentY = cardY + 80;

  // NAILOX branding
  ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText(cfg.academy_name.toUpperCase(), centerX, contentY - 30);
  ctx.letterSpacing = '0';

  // ── Certificate title ────────────────────────────────────────────────────
  ctx.font = '300 42px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICADO DE', centerX, contentY + 30);

  ctx.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#e11d48';
  ctx.fillText('APROBACI\u00D3N', centerX, contentY + 85);

  // ── Online badge ─────────────────────────────────────────────────────────
  const badgeY = contentY + 115;
  ctx.font = '500 13px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('CURSO ONLINE VERIFICADO', centerX, badgeY);

  // ── Decorative line ──────────────────────────────────────────────────────
  const lineY = badgeY + 25;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, lineY);
  ctx.lineTo(centerX + 120, lineY);
  ctx.stroke();

  // ── "Otorgado a" text ────────────────────────────────────────────────────
  ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('Otorgado a', centerX, lineY + 35);

  // ── Student name (hero) ──────────────────────────────────────────────────
  ctx.font = 'italic 500 56px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(studentName || 'Nombre del Estudiante', centerX, lineY + 100);

  // Name underline
  const nameWidth = ctx.measureText(studentName || 'Nombre del Estudiante').width;
  const underlineGrad = ctx.createLinearGradient(centerX - nameWidth/2, 0, centerX + nameWidth/2, 0);
  underlineGrad.addColorStop(0, 'transparent');
  underlineGrad.addColorStop(0.5, '#e11d48');
  underlineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = underlineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - nameWidth / 2 - 10, lineY + 110);
  ctx.lineTo(centerX + nameWidth / 2 + 10, lineY + 110);
  ctx.stroke();

  // ── Achievement text ─────────────────────────────────────────────────────
  ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('Por haber completado exitosamente el programa', centerX, lineY + 145);

  // ── Course title ─────────────────────────────────────────────────────────
  ctx.font = '600 28px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText(cfg.course_title, centerX, lineY + 185);

  // ── Stats row ────────────────────────────────────────────────────────────
  const statsY = lineY + 240;
  const stats = [
    { value: String(completedLessons), label: 'Lecciones' },
    { value: String(totalModules), label: 'M\u00f3dulos' },
    { value: totalHours, label: 'Horas' },
  ];

  const statSpacing = 160;
  const statsStartX = centerX - ((stats.length - 1) * statSpacing) / 2;

  stats.forEach((s, i) => {
    const x = statsStartX + i * statSpacing;

    // Stat value
    ctx.font = 'bold 32px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#e11d48';
    ctx.fillText(s.value, x, statsY);

    // Stat label
    ctx.font = '500 12px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(s.label.toUpperCase(), x, statsY + 20);
  });

  // ── Date ─────────────────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '400 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(`Emitido el ${dateStr}`, centerX, statsY + 70);

  // ── Verification footer ──────────────────────────────────────────────────
  const footerY = cardY + cardH - 50;

  // Verification badge
  const verifyBadgeW = 420;
  const verifyBadgeH = 36;
  const verifyBadgeX = centerX - verifyBadgeW / 2;

  ctx.fillStyle = '#f3f4f6';
  ctx.beginPath();
  ctx.roundRect(verifyBadgeX, footerY - 12, verifyBadgeW, verifyBadgeH, 18);
  ctx.fill();

  ctx.font = '500 12px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('\u2713 Certificaci\u00f3n de Aprobaci\u00f3n Online  \u2022  Verificado digitalmente', centerX, footerY + 8);

  // ── Bottom ID watermark ──────────────────────────────────────────────────
  ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const watermark = certId
    ? `ID: ${certId}  \u2022  ${cfg.academy_name}`
    : `${cfg.academy_name}  \u2022  Certificado digital`;
  ctx.fillText(watermark, centerX, H - 20);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CertificateModal({
  isOpen,
  onClose,
  completedLessons,
  totalLessons,
  totalModules,
  totalHours,
}: Props) {
  const { user, isAdmin } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [studentName, setStudentName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [step, setStep] = useState<'name' | 'certificate'>('name');
  const [nameChangesUsed, setNameChangesUsed] = useState(0);
  const [certConfig, setCertConfig] = useState<CertConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const drawnRef = useRef(false);

  // Shareable link state
  const [certId, setCertId] = useState('');
  const [certLink, setCertLink] = useState('');
  const [savingCert, setSavingCert] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // PDF loading state
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load cert config from Supabase once
  useEffect(() => {
    if (configLoaded) return;
    supabase
      .from('center_settings')
      .select('academy_name, course_title')
      .eq('id', 'main')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCertConfig({
            academy_name: data.academy_name ?? DEFAULT_CONFIG.academy_name,
            course_title: data.course_title ?? DEFAULT_CONFIG.course_title,
          });
        }
        setConfigLoaded(true);
      });
  }, [configLoaded]);

  // On open: restore saved name & certId
  useEffect(() => {
    if (!isOpen) {
      drawnRef.current = false;
      return;
    }
    if (!user) return;

    const saved = getSavedName(user.id);
    const changes = getChangesCount(user.id);
    const savedCertId = getSavedCertId(user.id);
    setNameChangesUsed(changes);
    setCopied(false);
    setShowShare(false);

    if (savedCertId) {
      setCertId(savedCertId);
      const origin = window.location.origin;
      const base = (window as unknown as Record<string, string>).__BASE_PATH__ ?? '';
      setCertLink(`${origin}${base}/certificado/${savedCertId}`);
    }

    if (saved) {
      setStudentName(saved);
      setNameInput(saved);
      setStep('certificate');
    } else {
      setStudentName('');
      setNameInput('');
      setStep('name');
    }
  }, [isOpen, user]);

  // Draw certificate
  const drawWhenReady = useCallback(() => {
    if (!canvasRef.current || !studentName || !configLoaded) return;
    requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      drawCertificateCanvas(
        canvasRef.current, studentName, certConfig,
        completedLessons, totalModules, totalHours, certId || undefined,
      );
      drawnRef.current = true;
    });
  }, [studentName, certConfig, configLoaded, completedLessons, totalModules, totalHours, certId]);

  useEffect(() => {
    if (step === 'certificate' && isOpen) {
      drawnRef.current = false;
      drawWhenReady();
    }
  }, [step, isOpen, drawWhenReady]);

  // Save certificate to Supabase and get shareable link
  const handleSaveCertificate = useCallback(async (name: string) => {
    if (!user) return;
    setSavingCert(true);
    try {
      // Check if user already has a certificate
      const existingId = getSavedCertId(user.id);
      let id = existingId;

      if (existingId) {
        // Update existing
        await supabase.from('certificates').update({
          student_name: name,
          course_title: certConfig.course_title,
          academy_name: certConfig.academy_name,
          completed_lessons: completedLessons,
          total_modules: totalModules,
          total_hours: totalHours,
          updated_at: new Date().toISOString(),
        }).eq('id', existingId).eq('user_id', user.id);
      } else {
        // Insert new
        const { data } = await supabase.from('certificates').insert({
          user_id: user.id,
          student_name: name,
          course_title: certConfig.course_title,
          academy_name: certConfig.academy_name,
          completed_lessons: completedLessons,
          total_modules: totalModules,
          total_hours: totalHours,
          issued_at: new Date().toISOString(),
        }).select('id').maybeSingle();
        if (data) id = (data as { id: string }).id;
      }

      if (id) {
        saveCertId(user.id, id);
        setCertId(id);
        const origin = window.location.origin;
        const base = (window as unknown as Record<string, string>).__BASE_PATH__ ?? '';
        const link = `${origin}${base}/certificado/${id}`;
        setCertLink(link);
      }
    } catch { /* ignore */ }
    setSavingCert(false);
  }, [user, certConfig, completedLessons, totalModules, totalHours]);

  const canChangeName = isAdmin || nameChangesUsed < MAX_NAME_CHANGES;
  const changesLeft = Math.max(0, MAX_NAME_CHANGES - nameChangesUsed);
  const isFirstGeneration = !studentName;

  const handleGenerate = useCallback(async () => {
    if (!nameInput.trim()) return;
    const isChange = !!studentName && nameInput.trim() !== studentName;
    if (isChange && !canChangeName) return;

    if (isChange && !isAdmin && user) {
      const newCount = incrementChanges(user.id);
      setNameChangesUsed(newCount);
    }

    const finalName = nameInput.trim();
    setStudentName(finalName);
    if (user) saveName(user.id, finalName);
    drawnRef.current = false;
    setStep('certificate');

    // Save to Supabase for shareable link
    await handleSaveCertificate(finalName);
  }, [nameInput, studentName, canChangeName, isAdmin, user, handleSaveCertificate]);

  const handleChangeName = useCallback(() => {
    if (!canChangeName) return;
    setStep('name');
  }, [canChangeName]);

  const handleDownloadPng = useCallback(() => {
    if (!canvasRef.current) return;
    drawCertificateCanvas(
      canvasRef.current, studentName, certConfig,
      completedLessons, totalModules, totalHours, certId || undefined,
    );
    const link = document.createElement('a');
    link.download = `certificado-${studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  }, [studentName, certConfig, completedLessons, totalModules, totalHours, certId]);

  const handleDownloadPdf = useCallback(async () => {
    if (!canvasRef.current) return;
    setPdfLoading(true);
    try {
      drawCertificateCanvas(
        canvasRef.current, studentName, certConfig,
        completedLessons, totalModules, totalHours, certId || undefined,
      );
      const { default: jsPDF } = await import('jspdf');
      const imgData = canvasRef.current.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1400, 880] });
      pdf.addImage(imgData, 'PNG', 0, 0, 1400, 880);
      pdf.save(`certificado-${studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch { /* ignore */ }
    setPdfLoading(false);
  }, [studentName, certConfig, completedLessons, totalModules, totalHours, certId]);

  const handleCopyLink = useCallback(() => {
    if (!certLink) return;
    navigator.clipboard.writeText(certLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [certLink]);

  const handleShareLinkedIn = useCallback(() => {
    if (!certLink) return;
    const url = encodeURIComponent(certLink);
    const title = encodeURIComponent(`Obtuve mi certificado en ${certConfig.course_title} — ${certConfig.academy_name}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  }, [certLink, certConfig]);

  const handleShareWhatsApp = useCallback(() => {
    if (!certLink) return;
    const text = encodeURIComponent(`¡Completé el ${certConfig.course_title}! 🎓 Mira mi certificado: ${certLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [certLink, certConfig]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer z-10 text-gray-500"
        >
          <i className="ri-close-line text-lg"></i>
        </button>

        {step === 'name' ? (
          <div className="flex flex-col items-center px-8 py-14 text-center">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-rose-50 mb-6">
              <i className="ri-award-fill text-5xl text-rose-500"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Felicitaciones!</h2>
            <p className="text-gray-500 text-lg mb-1">
              Completaste el <span className="font-semibold text-rose-600">100% del curso</span>
            </p>
            <p className="text-gray-400 text-sm mb-2">
              {completedLessons} lecciones · {totalModules} módulos · {totalHours}
            </p>
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 mb-8">
              <i className="ri-shield-check-line text-rose-500 text-sm"></i>
              <span className="text-rose-700 text-xs font-semibold">Certificación de Aprobación Online · Verificado digitalmente</span>
            </div>

            <div className="w-full max-w-sm border-t border-gray-100 mb-8"></div>

            <p className="text-gray-700 font-medium mb-3">
              ¿Cómo quieres que aparezca tu nombre en el certificado?
            </p>

            {!isFirstGeneration && !isAdmin && (
              <div className={`w-full max-w-sm mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
                changesLeft > 0
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <i className={`${changesLeft > 0 ? 'ri-information-line' : 'ri-error-warning-line'} shrink-0`}></i>
                {changesLeft > 0
                  ? <span>Puedes cambiar el nombre <strong>{changesLeft} vez más</strong> después de esto.</span>
                  : <span>Has alcanzado el límite de {MAX_NAME_CHANGES} cambios de nombre.</span>
                }
              </div>
            )}

            {isAdmin && !isFirstGeneration && (
              <div className="w-full max-w-sm mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-700">
                <i className="ri-shield-user-line shrink-0"></i>
                Modo administrador — cambios ilimitados
              </div>
            )}

            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Ej: Ana García Martínez"
              className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-rose-400 mb-4"
            />
            <button
              onClick={handleGenerate}
              disabled={!nameInput.trim() || (!isFirstGeneration && !canChangeName) || savingCert}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                nameInput.trim() && (isFirstGeneration || canChangeName) && !savingCert
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {savingCert
                ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />Generando...</>
                : <><i className="ri-medal-line"></i>{isFirstGeneration ? 'Generar mi certificado' : 'Actualizar certificado'}</>
              }
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-8">
            {/* Top bar */}
            <div className="flex items-center justify-between w-full mb-4 px-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tu certificado</h2>
                <p className="text-xs text-gray-400 mt-0.5">Certificación de Aprobación Online · {certConfig.academy_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {canChangeName ? (
                  <button
                    onClick={handleChangeName}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line"></i>
                    Cambiar nombre
                    {!isAdmin && (
                      <span className="ml-1 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                        {changesLeft} restante{changesLeft !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-gray-300 cursor-not-allowed whitespace-nowrap">
                    <i className="ri-lock-line"></i>
                    <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">Límite alcanzado</span>
                  </div>
                )}
                {/* Download PNG */}
                <button
                  onClick={handleDownloadPng}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-image-line"></i>PNG
                </button>
                {/* Download PDF */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  {pdfLoading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />PDF...</>
                    : <><i className="ri-file-pdf-line"></i>PDF</>
                  }
                </button>
                {/* Share toggle */}
                <button
                  onClick={() => setShowShare(s => !s)}
                  className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-share-line"></i>Compartir
                </button>
              </div>
            </div>

            {/* Share panel */}
            {showShare && (
              <div className="w-full mb-4 bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-rose-800 mb-3 flex items-center gap-1.5">
                  <i className="ri-share-line"></i>Compartir tu certificado
                </p>
                {certLink ? (
                  <>
                    {/* Link copy */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-mono truncate">
                        {certLink}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          copied
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <i className={copied ? 'ri-check-line' : 'ri-clipboard-line'}></i>
                        {copied ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    {/* Social buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleShareWhatsApp}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-whatsapp-line"></i>WhatsApp
                      </button>
                      <button
                        onClick={handleShareLinkedIn}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#0958a8] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-linkedin-box-line"></i>LinkedIn
                      </button>
                      <a
                        href={certLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-external-link-line"></i>Ver página pública
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-rose-600">
                    <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin"></div>
                    Generando enlace único...
                  </div>
                )}
              </div>
            )}

            {/* Certification badge */}
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-4 py-1.5 mb-4 self-start ml-2">
              <i className="ri-shield-check-line text-rose-500 text-sm"></i>
              <span className="text-rose-700 text-xs font-semibold">Certificación de Aprobación Online · Verificado digitalmente</span>
            </div>

            {/* Canvas */}
            <div className="w-full overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={1400}
                height={880}
                className="w-full h-auto block"
                style={{ maxHeight: '62vh', objectFit: 'contain' }}
              />
            </div>

            <p className="text-gray-400 text-xs mt-4 text-center">
              PNG (1400×880 px) · PDF landscape · Enlace público único por estudiante
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
