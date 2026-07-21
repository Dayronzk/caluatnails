import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function BlogListPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    []
  );
  const categories = useMemo(() => [...new Set(sorted.map(p => p.category))], [sorted]);

  const filtered = useMemo(
    () => activeCategory ? sorted.filter(p => p.category === activeCategory) : sorted,
    [sorted, activeCategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-organic-cream via-white to-organic-blush/30">
      <Helmet>
        <title>Blog CALUATNAILS — Consejos de Manicura y Pedicura en Barcelona</title>
        <meta name="description" content="Guías, tendencias y consejos profesionales sobre manicura, pedicura, uñas en gel, cuidado de cutículas y más. Por el equipo de CALUATNAILS en Barcelona." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://www.caluatnails.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.caluatnails.com/blog" />
        <meta property="og:title" content="Blog CALUATNAILS — Consejos profesionales de manicura y pedicura" />
        <meta property="og:description" content="Guías, tendencias y consejos profesionales sobre uñas. Por CALUATNAILS en Barcelona." />
        <meta property="og:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="CALUATNAILS" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.caluatnails.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.caluatnails.com/blog" },
                ],
              },
              {
                "@type": "Blog",
                "name": "Blog CALUATNAILS",
                "description": "Consejos profesionales de manicura y pedicura por CALUATNAILS Barcelona",
                "url": "https://www.caluatnails.com/blog",
                "inLanguage": "es",
                "publisher": { "@id": "https://www.caluatnails.com/#organization" },
                "blogPost": sorted.map(p => ({
                  "@type": "BlogPosting",
                  "headline": p.title,
                  "url": `https://www.caluatnails.com/blog/${p.slug}`,
                  "datePublished": p.publishedAt,
                  "image": `https://www.caluatnails.com${p.image}`,
                  "author": { "@type": "Organization", "name": "CALUATNAILS" },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      <Navbar />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 lg:px-10">
        <header className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="rose" icon="ri-book-open-line">
            Blog CALUATNAILS
          </Badge>
          <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Consejos de Manicura y Pedicura
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
            Guías profesionales, tendencias de diseño y consejos para mantener tus uñas fuertes e impecables. Por las estilistas de <strong className="text-gray-900 font-bold">CALUATNAILS</strong>, Barcelona.
          </p>
        </header>

        {/* Category Pills */}
        <div className="mb-12 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-soft-xs ${
              activeCategory === null
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white scale-105"
                : "bg-white/90 text-gray-700 border border-rose-100 hover:bg-rose-50/60"
            }`}
          >
            Todos ({sorted.length})
          </button>
          {categories.map(cat => {
            const count = sorted.filter(p => p.category === cat).length;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(active ? null : cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-soft-xs ${
                  active
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white scale-105"
                    : "bg-white/90 text-gray-700 border border-rose-100 hover:bg-rose-50/60"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Featured Post (first item) */}
        {!activeCategory && filtered[0] && (
          <div className="mb-12">
            <Card
              variant="gradient"
              padding="lg"
              className="group cursor-pointer hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate(`/blog/${filtered[0].slug}`)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-soft-xs">
                  <img
                    src={filtered[0].image}
                    alt={filtered[0].imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <Badge variant="gold">Destacado</Badge>
                    <span className="text-rose-600 font-bold uppercase">{filtered[0].category}</span>
                    <span className="text-gray-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {filtered[0].readMinutes} min lectura
                    </span>
                  </div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug group-hover:text-rose-600 transition-colors">
                    {filtered[0].title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {filtered[0].excerpt}
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                      Leer artículo completo <i className="ri-arrow-right-line" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grid of posts */}
        <section className="space-y-6">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12 font-medium">No hay artículos publicados en esta categoría.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory ? filtered : filtered.slice(1)).map(post => (
                <Card
                  key={post.slug}
                  variant="glass"
                  padding="none"
                  className="group cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-rose-600 uppercase tracking-wider">{post.category}</span>
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-400" /> {post.readMinutes} min
                        </span>
                      </div>
                      <h3 className="font-playfair text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 font-medium">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                      <span>Leer más</span>
                      <i className="ri-arrow-right-line ml-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* CTA Bottom */}
        <section className="mt-20">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-4xl p-8 sm:p-12 text-center text-white shadow-soft-lg space-y-4">
            <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold">¿Lista para tu próxima manicura en Barcelona?</h2>
            <p className="text-white/90 text-sm max-w-xl mx-auto font-medium">
              Pon en práctica los consejos de nuestro blog reservando tu cita con las estilistas de CALUATNAILS.
            </p>
            <div className="pt-2">
              <Button
                variant="gold"
                size="lg"
                icon="ri-calendar-check-line"
                onClick={() => navigate("/reservar")}
              >
                Reservar Mi Cita
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
