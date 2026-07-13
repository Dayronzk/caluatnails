import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/lib/supabase";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";

interface Professional {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  instagram: string | null;
  portfolio_images: string[] | null;
  rating: number;
  review_count: number;
  active: boolean;
  address: string | null;
  profiles: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface Review {
  id: string;
  professional_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  pro_reply: string | null;
  pro_reply_at: string | null;
}

type SortBy = "rating" | "reviews" | "name";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <i
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"}`}
        ></i>
      ))}
    </div>
  );
}

function getInitials(name: string | null): string {
  if (!name) return "P";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const GRADIENT_COLORS = [
  "from-rose-400 to-pink-500",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
  "from-red-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-pink-500",
];

export default function ProfesionalesPage() {
  useSEO({
    title: "Nuestras Profesionales — Manicura y Pedicura en Barcelona",
    description: "Conoce al equipo de profesionales certificadas del salón NAILOX en Barcelona. Especialistas en manicura con nivelación, semipermanente, uñas en gel y pedicura. Reserva con tu favorita.",
    ogTitle: "Equipo NAILOX — Profesionales de Manicura en Barcelona",
    ogDescription: "Profesionales certificadas listas para atenderte en el salón NAILOX del Eixample. Revisa especialidades y reseñas, y reserva online.",
    ogImage: "https://readdy.ai/api/search-image?query=professional%20nail%20technicians%20certified%20beauty%20salon%20team%20elegant%20rose%20gold%20warm%20tones%20luxury%20spa%20manicure%20pedicure%20experts%20women%20professionals%20minimal%20aesthetic&width=1200&height=630&seq=og-profesionales-v1&orientation=landscape",
    ogUrl: "/profesionales",
    canonical: "/profesionales",
    keywords: "profesionales manicura certificadas, nail technician, pedicura profesional, alumnas NAILOX",
  });

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [portfolioPro, setPortfolioPro] = useState<Professional | null>(null);
  const [portfolioIndex, setPortfolioIndex] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("rating");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: pros } = await supabase
        .from("professional_profiles")
        .select("*, profiles(name, email, avatar_url)")
        .eq("active", true)
        .order("rating", { ascending: false });

      const { data: revs } = await supabase
        .from("professional_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      setProfessionals((pros ?? []) as Professional[]);
      setReviews((revs ?? []) as Review[]);
      setLoading(false);
    };
    load();
  }, []);

  // Unique specialties
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    professionals.forEach((p) => p.specialties?.forEach((sp) => set.add(sp)));
    return Array.from(set).sort();
  }, [professionals]);

  // Filtered + sorted
  const filteredPros = useMemo(() => {
    let pros = [...professionals];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      pros = pros.filter((p) =>
        p.profiles?.name?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.specialties?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (selectedSpecialty !== "all") {
      pros = pros.filter((p) => p.specialties?.includes(selectedSpecialty));
    }

    if (sortBy === "rating") {
      pros.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "reviews") {
      pros.sort((a, b) => b.review_count - a.review_count);
    } else if (sortBy === "name") {
      pros.sort((a, b) => (a.profiles?.name ?? "").localeCompare(b.profiles?.name ?? ""));
    }

    return pros;
  }, [professionals, search, selectedSpecialty, sortBy]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = professionals.length;
    const totalReviews = professionals.reduce((sum, p) => sum + p.review_count, 0);
    const avgRating = total > 0
      ? professionals.reduce((sum, p) => sum + p.rating, 0) / total
      : 0;
    return { total, totalReviews, avgRating };
  }, [professionals]);

  const proReviews = (proId: string) => reviews.filter((r) => r.professional_id === proId);

  // Badge logic
  const getProBadge = (pro: Professional) => {
    if (pro.rating >= 4.8 && pro.review_count >= 10) {
      return { label: "Top Rated", color: "bg-amber-500", icon: "ri-trophy-fill" };
    }
    if (pro.review_count >= 20) {
      return { label: "Más Reservada", color: "bg-rose-500", icon: "ri-fire-fill" };
    }
    if (pro.review_count < 3) {
      return { label: "Nueva", color: "bg-emerald-500", icon: "ri-sparkling-fill" };
    }
    return null;
  };

  const openPortfolio = (pro: Professional, idx = 0) => {
    setPortfolioPro(pro);
    setPortfolioIndex(idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <span className="font-bold text-xl text-gray-900">NAIL<span className="text-rose-500">OX</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/tarjeta-regalo" className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 border border-amber-400 text-amber-600 hover:bg-amber-50 rounded-full transition-colors cursor-pointer">
              <i className="ri-gift-line mr-1.5"></i>Tarjeta Regalo
            </Link>
            <Link to="/reservar" className="text-sm font-semibold px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-calendar-line mr-1.5"></i>Reservar cita
            </Link>
            <Link to="/" className="hidden md:inline-flex text-sm text-gray-500 hover:text-rose-600 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-arrow-left-line mr-1"></i>Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — improved with stats */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 text-white py-20 md:py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://readdy.ai/api/search-image?query=elegant%20nail%20salon%20interior%20with%20soft%20pink%20tones%2C%20professional%20manicure%20station%2C%20luxury%20beauty%20spa%20atmosphere%2C%20warm%20lighting%2C%20minimalist%20aesthetic%2C%20high%20end%20salon%20decor%20with%20rose%20gold%20accents&width=1400&height=400&seq=prof-hero-1&orientation=landscape"
            alt="Profesionales"
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <i className="ri-award-line"></i> Profesionales certificadas NAILOX
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Encuentra a tu <span className="text-amber-200">profesional</span> ideal
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Alumnas certificadas listas para transformar tus uñas. Elige por especialidad, rating o cercanía.
          </p>

          {/* Stats */}
          {!loading && stats.total > 0 && (
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/20">
                <div className="text-2xl md:text-4xl font-bold mb-1">{stats.total}+</div>
                <div className="text-xs md:text-sm text-white/70">Profesionales</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/20">
                <div className="text-2xl md:text-4xl font-bold mb-1 flex items-center justify-center gap-1">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
                  <i className="ri-star-fill text-amber-300 text-xl md:text-3xl"></i>
                </div>
                <div className="text-xs md:text-sm text-white/70">Rating medio</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/20">
                <div className="text-2xl md:text-4xl font-bold mb-1">{stats.totalReviews}+</div>
                <div className="text-xs md:text-sm text-white/70">Reseñas</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filters bar */}
      {!loading && professionals.length > 0 && (
        <section className="bg-white border-b border-gray-100 sticky top-16 z-20 py-4">
          <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, bio o especialidad..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
              />
            </div>

            {/* Specialty filter */}
            {allSpecialties.length > 0 && (
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-rose-300 outline-none text-sm cursor-pointer min-w-[180px]"
              >
                <option value="all">Todas las especialidades</option>
                {allSpecialties.map((sp) => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-rose-300 outline-none text-sm cursor-pointer min-w-[160px]"
            >
              <option value="rating">⭐ Mejor valoradas</option>
              <option value="reviews">🔥 Más reseñas</option>
              <option value="name">🔤 A - Z</option>
            </select>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            <span className="ml-3 text-gray-500">Cargando profesionales...</span>
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
              <i className="ri-user-star-line text-3xl text-rose-300"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Próximamente</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Nuestras primeras profesionales certificadas aparecerán aquí muy pronto. ¡Completa el curso y sé la primera!
            </p>
            <Link to="/#tecnicas" className="inline-block mt-6 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap">
              Ver el curso
            </Link>
          </div>
        ) : filteredPros.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-search-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No hay coincidencias</h3>
            <p className="text-gray-500 mb-4 text-sm">Intenta cambiar los filtros para ver más profesionales</p>
            <button
              onClick={() => { setSearch(""); setSelectedSpecialty("all"); setSortBy("rating"); }}
              className="text-sm font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-bold text-gray-900">{filteredPros.length}</span> {filteredPros.length === 1 ? "profesional disponible" : "profesionales disponibles"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPros.map((pro, idx) => {
                const revs = proReviews(pro.id);
                const name = pro.profiles?.name ?? "Profesional";
                const badge = getProBadge(pro);
                const portfolioCount = pro.portfolio_images?.length ?? 0;

                return (
                  <div
                    key={pro.id}
                    className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Portfolio image with overlay */}
                    <div className="relative h-56 bg-gradient-to-br from-rose-100 to-pink-100 overflow-hidden cursor-pointer" onClick={() => portfolioCount > 0 && openPortfolio(pro, 0)}>
                      {pro.portfolio_images && pro.portfolio_images.length > 0 ? (
                        <img
                          src={pro.portfolio_images[0]}
                          alt={name}
                          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="ri-image-line text-4xl text-rose-200"></i>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {badge ? (
                          <div className={`${badge.color} text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
                            <i className={`${badge.icon} text-xs`}></i>
                            <span className="text-xs font-bold">{badge.label}</span>
                          </div>
                        ) : <div />}
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                          <i className="ri-shield-check-fill text-rose-500 text-xs"></i>
                          <span className="text-xs font-semibold text-gray-800">Certificada</span>
                        </div>
                      </div>

                      {/* Portfolio counter */}
                      {portfolioCount > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 text-xs">
                          <i className="ri-gallery-line"></i>
                          {portfolioCount} fotos
                        </div>
                      )}

                      {/* Rating overlay */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                        <i className="ri-star-fill text-amber-400 text-sm"></i>
                        <span className="text-sm font-bold text-gray-900">{pro.rating > 0 ? pro.rating.toFixed(1) : "Nueva"}</span>
                        <span className="text-xs text-gray-500">({pro.review_count})</span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Profile */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${GRADIENT_COLORS[idx % GRADIENT_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-white shadow-md`}>
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StarRating rating={pro.rating} />
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {pro.bio && (
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">{pro.bio}</p>
                      )}

                      {/* Specialties */}
                      {pro.specialties && pro.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pro.specialties.slice(0, 3).map((sp) => (
                            <span key={sp} className="text-xs px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full font-medium">
                              {sp}
                            </span>
                          ))}
                          {pro.specialties.length > 3 && (
                            <span className="text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full font-medium">
                              +{pro.specialties.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Instagram + Address row */}
                      <div className="flex items-center gap-3 mb-4 text-xs">
                        {pro.instagram && (
                          <a
                            href={`https://instagram.com/${pro.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <i className="ri-instagram-line text-base"></i>
                            <span className="truncate max-w-[100px]">@{pro.instagram.replace(/^@/, "")}</span>
                          </a>
                        )}
                        {pro.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pro.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <i className="ri-map-pin-line text-base"></i>
                            Ver ubicación
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <Link
                          to="/reservar"
                          className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl text-center transition-all hover:shadow-lg hover:shadow-rose-200 cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-calendar-line mr-1.5"></i>Reservar
                        </Link>
                        <button
                          onClick={() => setSelectedPro(pro)}
                          className="flex-1 py-2.5 border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-700 hover:text-rose-600 text-sm font-semibold rounded-xl text-center transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-star-line mr-1.5"></i>Reseñas ({revs.length})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        {!loading && professionals.length > 0 && (
          <div className="mt-16 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 rounded-3xl p-8 md:p-12 text-center border border-rose-100">
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md mb-4">
                <i className="ri-graduation-cap-line text-3xl text-rose-500"></i>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                ¿Quieres formar parte del equipo?
              </h2>
              <p className="text-gray-600 mb-6">
                Únete al curso de NAILOX y conviértete en profesional certificada. Aparecerás en esta página
                y empezarás a recibir reservas en tu propio salón o en el nuestro.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/#academia"
                  className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-right-line"></i> Conocer el curso
                </Link>
                <Link
                  to="/contacto"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-message-line"></i> Hablar con nosotros
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Portfolio modal */}
      {portfolioPro && portfolioPro.portfolio_images && portfolioPro.portfolio_images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPortfolioPro(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPortfolioPro(null)}
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            <div className="relative">
              <img
                src={portfolioPro.portfolio_images[portfolioIndex]}
                alt={`Portfolio ${portfolioIndex + 1}`}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              {portfolioPro.portfolio_images.length > 1 && (
                <>
                  <button
                    onClick={() => setPortfolioIndex((i) => (i - 1 + portfolioPro.portfolio_images!.length) % portfolioPro.portfolio_images!.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <i className="ri-arrow-left-line text-xl"></i>
                  </button>
                  <button
                    onClick={() => setPortfolioIndex((i) => (i + 1) % portfolioPro.portfolio_images!.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <i className="ri-arrow-right-line text-xl"></i>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white rounded-full px-3 py-1 text-sm">
                    {portfolioIndex + 1} / {portfolioPro.portfolio_images.length}
                  </div>
                </>
              )}
            </div>
            <p className="text-center text-white/80 mt-4 text-sm">
              Portfolio de <span className="font-semibold">{portfolioPro.profiles?.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Reviews modal */}
      {selectedPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPro(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${GRADIENT_COLORS[0]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {getInitials(selectedPro.profiles?.name ?? null)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedPro.profiles?.name ?? "Profesional"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={selectedPro.rating} />
                    <span className="text-sm text-gray-500">
                      {selectedPro.rating > 0 ? `${selectedPro.rating.toFixed(1)} (${selectedPro.review_count} reseñas)` : "Sin reseñas aún"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPro(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-lg text-gray-500"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* CTA Google Business */}
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-5 hover:shadow-md transition-all group border border-rose-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <i className="ri-google-fill text-2xl bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">Deja tu reseña en Google</h3>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => <i key={i} className="ri-star-fill text-amber-400 text-xs"></i>)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Tu opinión nos ayuda a crecer y a que otras clientas descubran NAILOX. Menos de 1 minuto.
                    </p>
                    <span className="inline-flex items-center gap-2 bg-rose-500 group-hover:bg-rose-600 transition-colors text-white px-4 py-2 rounded-full text-xs font-bold">
                      Escribir reseña <i className="ri-external-link-line"></i>
                    </span>
                  </div>
                </div>
              </a>

              {/* Address in modal */}
              {selectedPro.address && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <i className="ri-map-pin-line text-rose-400 text-sm shrink-0"></i>
                  <p className="text-xs text-gray-600 flex-1">{selectedPro.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPro.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 bg-white border border-rose-200 hover:border-rose-400 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-map-2-line"></i> Ver en Maps
                  </a>
                </div>
              )}

              {/* Reviews list */}
              <div className="space-y-4">
                {proReviews(selectedPro.id).length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-star-line text-3xl text-gray-200 block mb-2"></i>
                    <p className="text-gray-400 text-sm">Sé la primera en dejar una reseña</p>
                  </div>
                ) : (
                  proReviews(selectedPro.id).map((rev) => (
                    <div key={rev.id} className="border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{rev.reviewer_name}</p>
                          <StarRating rating={rev.rating} />
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {rev.comment && <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>}
                      {/* Professional reply */}
                      {rev.pro_reply && (
                        <div className="mt-3 ml-3 pl-3 border-l-2 border-rose-200 bg-rose-50/50 rounded-r-xl p-3">
                          <p className="text-xs font-semibold text-rose-500 mb-1 flex items-center gap-1">
                            <i className="ri-reply-line"></i> Respuesta de la profesional
                          </p>
                          <p className="text-sm text-gray-700">{rev.pro_reply}</p>
                          {rev.pro_reply_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(rev.pro_reply_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CTA reservar */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Link
                to="/reservar"
                className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl text-center transition-colors cursor-pointer"
              >
                <i className="ri-calendar-line mr-1.5"></i>Reservar con {selectedPro.profiles?.name ?? "esta profesional"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
