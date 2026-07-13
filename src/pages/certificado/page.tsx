import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/lib/supabase';

interface CertData {
  id: string;
  student_name: string;
  course_title: string;
  academy_name: string;
  completed_lessons: number;
  total_modules: number;
  total_hours: string;
  issued_at: string;
}

function drawCertificate(canvas: HTMLCanvasElement, cert: CertData) {
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
  ctx.fillText(cert.academy_name.toUpperCase(), centerX, contentY - 30);

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
  ctx.fillText(cert.student_name, centerX, lineY + 100);

  // Name underline
  const nameWidth = ctx.measureText(cert.student_name).width;
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
  ctx.fillText(cert.course_title, centerX, lineY + 185);

  // ── Stats row ────────────────────────────────────────────────────────────
  const statsY = lineY + 240;
  const stats = [
    { value: String(cert.completed_lessons), label: 'Lecciones' },
    { value: String(cert.total_modules), label: 'M\u00f3dulos' },
    { value: cert.total_hours, label: 'Horas' },
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
  const dateStr = new Date(cert.issued_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
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
  ctx.fillText(`ID: ${cert.id}  \u2022  ${cert.academy_name}`, centerX, H - 20);
}

export default function CertificadoPublicoPage() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useSEO({
    title: cert ? `Certificado de ${cert.student_name} — ${cert.course_title}` : "Certificado Profesional NAILOX",
    description: cert ? `${cert.student_name} completó exitosamente el curso ${cert.course_title} en ${cert.academy_name}. Certificación online verificada.` : "Certificado de finalización profesional emitido por NAILOX Academia.",
    ogTitle: cert ? `${cert.student_name} obtuvo su Certificado NAILOX` : "Certificado Profesional NAILOX",
    ogDescription: cert ? `Completó el curso "${cert.course_title}" — ${cert.total_hours} de formación profesional. Emitido por ${cert.academy_name}.` : "Certificado de finalización profesional.",
    ogImage: "https://readdy.ai/api/search-image?query=professional%20certificate%20diploma%20elegant%20rose%20gold%20award%20achievement%20beauty%20nail%20course%20graduation%20luxury%20minimal%20clean%20design&width=1200&height=630&seq=og-cert-v1&orientation=landscape",
    ogUrl: `/certificado/${certId}`,
    canonical: `/certificado/${certId}`,
  });

  useEffect(() => {
    if (!certId) { setNotFound(true); setLoading(false); return; }
    supabase
      .from('certificates')
      .select('id, student_name, course_title, academy_name, completed_lessons, total_modules, total_hours, issued_at')
      .eq('id', certId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCert(data as CertData);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [certId]);

  useEffect(() => {
    if (!cert || !canvasRef.current) return;
    requestAnimationFrame(() => {
      if (canvasRef.current) drawCertificate(canvasRef.current, cert);
    });
  }, [cert]);

  const handleDownloadPng = useCallback(() => {
    if (!canvasRef.current || !cert) return;
    drawCertificate(canvasRef.current, cert);
    const link = document.createElement('a');
    link.download = `certificado-${cert.student_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  }, [cert]);

  const handleDownloadPdf = useCallback(async () => {
    if (!canvasRef.current || !cert) return;
    drawCertificate(canvasRef.current, cert);
    const { default: jsPDF } = await import('jspdf');
    const imgData = canvasRef.current.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1400, 880] });
    pdf.addImage(imgData, 'PNG', 0, 0, 1400, 880);
    pdf.save(`certificado-${cert.student_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }, [cert]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  const handleShareLinkedIn = useCallback(() => {
    if (!cert) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`Obtuve mi certificado en ${cert.course_title} — ${cert.academy_name}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  }, [cert]);

  const handleShareWhatsApp = useCallback(() => {
    if (!cert) return;
    const text = encodeURIComponent(`¡Completé el ${cert.course_title}! 🎓 Mira mi certificado: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [cert]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Cargando certificado...</p>
        </div>
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-rose-50 px-6">
        <div className="w-20 h-20 flex items-center justify-center bg-rose-100 rounded-full">
          <i className="ri-error-warning-line text-4xl text-rose-400"></i>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificado no encontrado</h2>
          <p className="text-gray-500 text-sm">El enlace puede ser incorrecto o el certificado fue eliminado.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-rose-600 text-white rounded-full text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-rose-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-rose-600 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line"></i>
            Volver al inicio
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-100">
              <i className="ri-shield-check-line text-rose-500 text-sm"></i>
            </div>
            <span className="text-xs font-semibold text-rose-700">Certificado verificado</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Info card */}
        <div className="bg-white rounded-3xl border border-rose-100 p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-100 shrink-0">
              <i className="ri-award-fill text-3xl text-rose-500"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cert.student_name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{cert.course_title}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="ri-book-2-line"></i>{cert.completed_lessons} lecciones
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="ri-layout-grid-line"></i>{cert.total_modules} módulos
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="ri-time-line"></i>{cert.total_hours}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="ri-calendar-line"></i>{issuedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-image-line"></i>
              PNG
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-pdf-line"></i>
              PDF
            </button>
          </div>
        </div>

        {/* Share + Verification row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Share card */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
            <p className="text-sm font-bold mb-1 flex items-center gap-2">
              <i className="ri-share-forward-line text-base"></i>
              Comparte tu logro
            </p>
            <p className="text-xs opacity-80 mb-4">Muéstrale al mundo que completaste el curso</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-whatsapp-line text-sm"></i>
                WhatsApp
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-linkedin-box-line text-sm"></i>
                LinkedIn
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm border transition-all cursor-pointer whitespace-nowrap ${
                  copied
                    ? 'bg-white text-rose-600 border-white'
                    : 'bg-white/20 hover:bg-white/30 border-white/30'
                }`}
              >
                <i className={copied ? 'ri-check-line' : 'ri-link-m'}></i>
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </div>
          </div>

          {/* Verification badge */}
          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-5">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-100 shrink-0">
              <i className="ri-shield-check-fill text-emerald-600 text-2xl"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Certificado auténtico</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Emitido por <strong>{cert.academy_name}</strong>
              </p>
              <p className="text-xs text-emerald-500 font-mono mt-1 truncate max-w-[200px]">ID: {cert.id}</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-sm">
          <canvas
            ref={canvasRef}
            width={1400}
            height={880}
            className="w-full h-auto block"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Este certificado es auténtico y fue emitido digitalmente por {cert.academy_name}. ID de verificación: {cert.id}
        </p>
      </div>
    </div>
  );
}
