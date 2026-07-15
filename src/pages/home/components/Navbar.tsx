import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Promociones", href: "/promociones", isLink: true },
  { label: "Suscripciones", href: "/suscripciones", isLink: true, highlight: true },
  { label: "Blog", href: "/blog", isLink: true },
];

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Force solid (light) navbar on every page except the homepage, where the
  // hero is dark and a transparent navbar looks right. On internal pages the
  // backgrounds are light/rose, so the transparent variant is unreadable.
  const isHome = location.pathname === "/";
  const scrolled = !isHome || scrollY > 60;

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${href}`);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const textColor = scrolled ? "text-gray-700 hover:text-rose-600" : "text-white/90 hover:text-white";
  const textColorActive = scrolled ? "text-gray-900" : "text-white";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white border-b border-gray-100" : "bg-transparent"
        }`}
      >
        <div className="w-full px-4 md:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <a href="/" className="flex items-center shrink-0 cursor-pointer">
            <span className={`font-playfair text-xl md:text-2xl font-bold tracking-widest transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>

          {/* Desktop Nav — center */}
          <ul className="hidden lg:flex items-center gap-5 xl:gap-7 flex-1 justify-center">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.isLink ? (
                  <a
                    href={link.href}
                    className={`text-xs xl:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      (link as { highlight?: boolean }).highlight
                        ? scrolled
                          ? "text-rose-600 font-semibold hover:text-rose-700"
                          : "text-rose-300 font-semibold hover:text-white"
                        : textColor
                    }`}
                  >
                    {(link as { highlight?: boolean }).highlight && (
                      <i className="ri-vip-crown-line mr-1 text-xs"></i>
                    )}
                    {link.label}
                  </a>
                ) : (
                  <button
                    onClick={() => handleNav(link.href)}
                    className={`text-xs xl:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${textColor}`}
                  >
                    {link.label}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Tarjeta Regalo */}
            <a
              href="/tarjeta-regalo"
              className={`inline-flex items-center gap-1.5 text-xs xl:text-sm font-semibold px-3 xl:px-4 py-2 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                scrolled
                  ? "border-amber-400 text-amber-600 hover:bg-amber-50"
                  : "border-white/40 text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="ri-gift-line text-sm"></i>
              <span className="hidden xl:inline">Tarjeta Regalo</span>
              <span className="xl:hidden">Regalo</span>
            </a>

            {/* Reservar */}
            <a
              href="/reservar"
              className={`inline-flex items-center gap-1.5 text-xs xl:text-sm font-semibold px-3 xl:px-4 py-2 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                scrolled
                  ? "border-rose-400 text-rose-600 hover:bg-rose-50"
                  : "border-white/60 text-white hover:bg-white/10"
              }`}
            >
              <i className="ri-calendar-line text-sm"></i>
              <span className="hidden xl:inline">Reservar cita</span>
              <span className="xl:hidden">Reservar</span>
            </a>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 text-xs xl:text-sm font-medium cursor-pointer whitespace-nowrap transition-colors px-3 py-2 rounded-full ${
                    scrolled ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/10 text-white/90"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(user.user_metadata?.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="hidden xl:inline max-w-[100px] truncate">
                    {user.user_metadata?.name ?? user.email?.split("@")[0]}
                  </span>
                  <i className={`ri-arrow-down-s-line text-sm transition-transform ${userMenuOpen ? "rotate-180" : ""}`}></i>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{user.user_metadata?.name ?? "Usuario"}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/mi-cuenta"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-user-line text-gray-400"></i> Mi cuenta
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/admin"); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-shield-user-line text-rose-400"></i> Panel admin
                      </button>
                    )}
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-logout-box-line"></i> Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className={`text-xs xl:text-sm font-semibold px-3 xl:px-4 py-2 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                    scrolled ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-white/40 text-white hover:bg-white/10"
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => navigate("/registro")}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs xl:text-sm font-semibold px-4 xl:px-5 py-2 xl:py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>

          {/* Mobile right: regalo + reservar + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <a
              href="/tarjeta-regalo"
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                scrolled
                  ? "border-amber-400 text-amber-600 hover:bg-amber-50"
                  : "border-white/40 text-white/90 hover:bg-white/10"
              }`}
            >
              <i className="ri-gift-line"></i>
              <span className="hidden sm:inline">Regalo</span>
            </a>
            <a
              href="/reservar"
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                scrolled
                  ? "border-rose-400 text-rose-600 hover:bg-rose-50"
                  : "border-white/60 text-white hover:bg-white/10"
              }`}
            >
              <i className="ri-calendar-line"></i>
              <span className="hidden sm:inline">Reservar</span>
            </a>
            <button
              className={`w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors ${
                scrolled ? "text-gray-800 hover:bg-gray-100" : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <i className={`text-xl ${menuOpen ? "ri-close-line" : "ri-menu-3-line"}`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu — slide down */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white border-t border-gray-100 px-4 py-4">
            {/* User info if logged in */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 bg-rose-50 rounded-xl mb-4">
                <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(user.user_metadata?.name ?? user.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.user_metadata?.name ?? "Usuario"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav links grid */}
            <div className="grid grid-cols-2 gap-1 mb-4">
              {navLinks.map((link) => (
                link.isLink ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      (link as { highlight?: boolean }).highlight
                        ? "text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold"
                        : "text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    <i className={`${(link as { highlight?: boolean }).highlight ? "ri-vip-crown-line" : "ri-star-line"} text-rose-400 text-xs`}></i>
                    {link.label}
                  </a>
                ) : (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer text-left"
                  >
                    <i className="ri-arrow-right-s-line text-rose-400 text-xs"></i>
                    {link.label}
                  </button>
                )
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/mi-cuenta"); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-user-line text-gray-400"></i> Mi cuenta
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <i className="ri-shield-user-line"></i> Panel de administración
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-logout-box-line"></i> Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/login"); }}
                    className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/registro"); }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
