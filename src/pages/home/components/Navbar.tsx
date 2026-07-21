import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const primaryNav = [
  { label: "Servicios", href: "/servicios" },
  { label: "Quiénes Somos", href: "/quienes-somos" },
  { label: "Promociones", href: "/promociones" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === "/";
  const scrolled = !isHome || scrollY > 40;

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-3 sm:px-6 pt-3 select-none pointer-events-none">
        <nav
          className={`max-w-7xl mx-auto rounded-full transition-all duration-300 pointer-events-auto ${
            scrolled
              ? "bg-white/95 backdrop-blur-md border border-rose-100/80 shadow-soft-md py-2.5 px-5 lg:px-7"
              : "bg-gray-950/40 backdrop-blur-md border border-white/20 py-3 px-5 lg:px-7"
          }`}
        >
          <div className="w-full flex items-center justify-between gap-4">

            {/* Brand Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-soft-xs group-hover:scale-105 transition-transform">
                <i className="ri-sparkles-line text-sm" />
              </div>
              <span className={`font-playfair text-lg sm:text-xl font-extrabold tracking-wider transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
                CALUATNAILS
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <ul className="hidden xl:flex items-center gap-6 xl:gap-7 flex-1 justify-center">
              {primaryNav.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={`text-xs xl:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap py-1 relative ${
                        isActive
                          ? "text-rose-600 font-bold"
                          : scrolled
                          ? "text-gray-700 hover:text-rose-600"
                          : "text-white/90 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}

              {/* Dropdown for Suscripciones & Tarjeta Regalo */}
              <li className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex items-center gap-1 text-xs xl:text-sm font-semibold cursor-pointer transition-colors py-1 ${
                    scrolled ? "text-gray-700 hover:text-rose-600" : "text-white/90 hover:text-white"
                  }`}
                >
                  <span>Más</span>
                  <i className={`ri-arrow-down-s-line text-xs transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {moreMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-100 py-2 shadow-soft-lg z-50 animate-fadeIn">
                    <a
                      href="/suscripciones"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <i className="ri-vip-crown-line text-amber-500" />
                      <span>Suscripciones VIP</span>
                    </a>
                    <a
                      href="/tarjeta-regalo"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <i className="ri-gift-line text-rose-500" />
                      <span>Tarjeta Regalo</span>
                    </a>
                  </div>
                )}
              </li>
            </ul>

            {/* Desktop Action CTAs */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <a
                href="/reservar"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white shadow-soft-xs hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-calendar-check-line text-sm" />
                <span>Reservar Cita</span>
              </a>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap transition-all px-3 py-1.5 rounded-full border ${
                      scrolled ? "border-rose-100 bg-rose-50/60 text-gray-800" : "border-white/30 bg-white/10 text-white"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {(user.user_metadata?.name ?? user.email ?? "U")[0].toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate">
                      {user.user_metadata?.name ?? user.email?.split("@")[0]}
                    </span>
                    <i className={`ri-arrow-down-s-line text-xs transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-100 py-2 shadow-soft-lg z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-rose-50 mb-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.user_metadata?.name ?? "Usuario"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/mi-cuenta"); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <i className="ri-user-line text-rose-400 text-sm" /> Mi Cuenta
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setUserMenuOpen(false); navigate("/admin"); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                        >
                          <i className="ri-shield-user-line text-rose-500 text-sm" /> Panel Admin
                        </button>
                      )}
                      <div className="border-t border-rose-50 mt-1 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut(); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
                        >
                          <i className="ri-logout-box-line text-sm" /> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all cursor-pointer ${
                    scrolled
                      ? "border-rose-200 bg-white hover:bg-rose-50 text-gray-700"
                      : "border-white/30 bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  Iniciar Sesión
                </button>
              )}
            </div>

            {/* Mobile Burger Trigger */}
            <div className="lg:hidden flex items-center gap-2">
              <a
                href="/reservar"
                className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs cursor-pointer"
              >
                <i className="ri-calendar-line text-sm" />
                <span>Reservar</span>
              </a>
              <button
                className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                  scrolled ? "text-gray-800 bg-rose-50" : "text-white bg-white/10"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                <i className={`text-lg ${menuOpen ? "ri-close-line" : "ri-menu-3-line"}`} />
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              menuOpen ? "max-h-96 opacity-100 mt-3 border-t border-rose-100/60 pt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-3 pb-2">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-rose-50/80 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                    {(user.user_metadata?.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.user_metadata?.name ?? "Usuario"}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {primaryNav.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-gray-800 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2 bg-rose-50/40"
                  >
                    <i className="ri-arrow-right-s-line text-rose-400" />
                    {link.label}
                  </a>
                ))}
                <a
                  href="/suscripciones"
                  onClick={() => setMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-amber-800 bg-amber-50/80 hover:bg-amber-100 flex items-center gap-2"
                >
                  <i className="ri-vip-crown-line text-amber-500" />
                  Suscripciones
                </a>
                <a
                  href="/tarjeta-regalo"
                  onClick={() => setMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-800 bg-rose-50/80 hover:bg-rose-100 flex items-center gap-2 col-span-2"
                >
                  <i className="ri-gift-line text-rose-500" />
                  Tarjeta Regalo
                </a>
              </div>

              <div className="pt-2 border-t border-rose-100/60 flex flex-col gap-2">
                {user ? (
                  <>
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/mi-cuenta"); }}
                      className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold text-gray-800 bg-rose-50/50 flex items-center gap-2"
                    >
                      <i className="ri-user-line text-rose-500" /> Mi Cuenta
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                        className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 bg-rose-100/60 flex items-center gap-2"
                      >
                        <i className="ri-shield-user-line text-rose-500" /> Panel Admin
                      </button>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <i className="ri-logout-box-line" /> Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/login"); }}
                      className="flex-1 py-2.5 rounded-2xl border border-rose-200 text-xs font-semibold text-gray-700 bg-white"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/registro"); }}
                      className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold"
                    >
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
