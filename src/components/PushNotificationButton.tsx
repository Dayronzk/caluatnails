import { Bell, BellOff, BellRing, Loader2, Smartphone, Share, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationButtonProps {
  clientAccountId?: string;
  profileId?: string;
  variant?: 'card' | 'inline';
  onSuccess?: () => void;
}

function useIOSPWAState() {
  if (typeof window === 'undefined') return { isIOS: false, isPWA: false };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
  return { isIOS, isPWA };
}

export default function PushNotificationButton({
  clientAccountId,
  profileId,
  variant = 'card',
  onSuccess,
}: PushNotificationButtonProps) {
  const { isSupported, permission, isSubscribed, loading, error, subscribe, unsubscribe } =
    usePushNotifications({ clientAccountId, profileId });

  const { isIOS, isPWA } = useIOSPWAState();

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };

  // iOS + Safari normal (not PWA) → show instructions
  if (isIOS && !isPWA) {
    if (variant === 'inline') return null;

    return (
      <div className="relative group overflow-hidden bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl transition-all duration-500 hover:shadow-blue-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Smartphone className="w-24 h-24 text-blue-500 -rotate-12" />
        </div>
        
        <div className="relative flex flex-col items-center text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-6 group-hover:scale-110 transition-transform duration-500">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-3">Notificaciones en tu iPhone 📱</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Para recibir recordatorios en tiempo real, añade Nailox a tu pantalla de inicio:
          </p>
          
          <div className="w-full space-y-4 text-left">
            {[
              { icon: <Share className="w-4 h-4 text-blue-500" />, text: "Pulsa el botón compartir en Safari" },
              { icon: <PlusSquare className="w-4 h-4 text-blue-500" />, text: "Selecciona \"Añadir a pantalla de inicio\"" },
              { icon: <Smartphone className="w-4 h-4 text-blue-500" />, text: "Abre la App desde tu pantalla principal" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/60 border border-white/40 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                  {step.icon}
                </div>
                <span className="text-sm font-medium text-slate-700">{step.text}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 py-2 px-4 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
            ✨ Aparecerá el botón mágico al instante
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported) return null;

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={loading || permission === 'denied'}
        className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 ${
          isSubscribed
            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
            : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:border-rose-200 hover:text-rose-500'
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
        ) : isSubscribed ? (
          <BellRing className="w-4 h-4 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        )}
        {isSubscribed ? 'Notificaciones On' : 'Activar Avisos'}
      </button>
    );
  }

  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-[2.5rem] p-1 shadow-2xl transition-all duration-700 hover:shadow-rose-500/10">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors" />
      
      <div className="relative bg-white/80 backdrop-blur-md rounded-[2.2rem] p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 transition-all duration-700 shadow-2xl ${
              isSubscribed 
                ? 'bg-gradient-to-tr from-emerald-400 to-emerald-600 rotate-6' 
                : 'bg-gradient-to-tr from-rose-400 to-rose-600 group-hover:rotate-6'
            }`}>
              {isSubscribed ? (
                <CheckCircle2 className="w-10 h-10 text-white animate-in zoom-in duration-500" />
              ) : (
                <BellRing className={`w-10 h-10 text-white ${!loading ? 'animate-[ring_2s_infinite]' : ''}`} />
              )}
            </div>
            {!isSubscribed && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {isSubscribed ? '¡Todo listo! ✨' : '¿Quieres un recordatorio?'}
            </h3>
            <p className="text-slate-500 leading-relaxed text-base max-w-sm mb-8">
              {isSubscribed
                ? 'Te avisaremos por aquí cuando tu cita esté confirmada y 1 hora antes de empezar.'
                : 'Olvídate de mirar el reloj. Te avisaremos 1 hora antes de tu cita para que no se te pase.'}
            </p>

            {permission === 'denied' ? (
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-amber-50 border border-amber-100 rounded-[1.5rem] text-sm text-amber-700 font-bold">
                <BellOff className="w-5 h-5 flex-shrink-0" />
                <span>Las notificaciones están bloqueadas. Actívalas en ajustes.</span>
              </div>
            ) : (
              <button
                onClick={handleClick}
                disabled={loading}
                className={`w-full md:w-auto px-10 py-5 rounded-[1.5rem] font-black text-base transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                  isSubscribed
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    : 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-rose-500/40'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <BellOff className="w-5 h-5" />
                    <span>Desactivar avisos</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-5 h-5" />
                    <span>¡Avísame gratis!</span>
                  </>
                )}
              </button>
            )}

            {error && (
              <p className="mt-4 text-xs font-bold text-rose-500 flex items-center justify-center md:justify-start gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          5% { transform: rotate(15deg); }
          10% { transform: rotate(-15deg); }
          15% { transform: rotate(12deg); }
          20% { transform: rotate(-12deg); }
          25% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
}

function PlusSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
  );
}

function AlertCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}
