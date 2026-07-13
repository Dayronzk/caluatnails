import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";

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
    <div className="min-h-screen bg-white font-inter">
      <Helmet>
        <title>Blog NAILOX — Consejos de Manicura y Pedicura en Barcelona</title>
        <meta name="description" content="Guías, tendencias y consejos profesionales sobre manicura, pedicura, uñas en gel, cuidado de cutículas y más. Por el equipo de NAILOX en Barcelona." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://www.nailox.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.nailox.com/blog" />
        <meta property="og:title" content="Blog NAILOX — Consejos profesionales de manicura y pedicura" />
        <meta property="og:description" content="Guías, tendencias y consejos profesionales sobre uñas. Por NAILOX en Barcelona." />
        <meta property="og:image" content="https://www.nailox.com/assets/manicure-premium.png" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="NAILOX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.nailox.com/assets/manicure-premium.png" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.nailox.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.nailox.com/blog" },
                ],
              },
              {
                "@type": "Blog",
                "name": "Blog NAILOX",
                "description": "Consejos profesionales de manicura y pedicura por NAILOX Barcelona",
                "url": "https://www.nailox.com/blog",
                "inLanguage": "es",
                "publisher": { "@id": "https://www.nailox.com/#organization" },
                "blogPost": sorted.map(p => ({
                  "@type": "BlogPosting",
                  "headline": p.title,
                  "url": `https://www.nailox.com/blog/${p.slug}`,
                  "datePublished": p.publishedAt,
                  "image": `https://www.nailox.com${p.image}`,
                  "author": { "@type": "Organization", "name": "NAILOX" },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Inicio</span>
          </button>
          <span className="font-playfair text-xl font-bold tracking-widest text-gray-900">
            NAIL<span className="text-rose-400">OX</span>
          </span>
          <button onClick={() => navigate("/reservar")} className="bg-rose-500 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">
            RESERVAR
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <header className="max-w-4xl mx-auto px-6 mb-12 text-center">
          <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">
            Blog NAILOX
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">
            Consejos de Manicura y Pedicura
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-base lg:text-lg leading-relaxed">
            Guías profesionales, tendencias y trucos para cuidar tus uñas. Por el equipo de <strong>NAILOX</strong>, salón de manicura premium en el Eixample de Barcelona.
          </p>
        </header>

        {/* Categories pill nav — clickable */}
        <div className="max-w-7xl mx-auto px-6 mb-10 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeCategory === null
                ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200"
                : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
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
                onClick={() => setActiveCategory(active ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  active
                    ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200"
                    : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Featured (first post) — only when no filter */}
        {!activeCategory && filtered[0] && (
          <section className="max-w-7xl mx-auto px-6 mb-12">
            <button
              onClick={() => navigate(`/blog/${filtered[0].slug}`)}
              className="group w-full text-left grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gradient-to-br from-rose-50 to-white rounded-3xl p-6 lg:p-10 border border-rose-100 hover:shadow-xl hover:shadow-rose-100/50 transition-all"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={filtered[0].image} alt={filtered[0].imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-rose-500 text-white rounded-full font-bold">DESTACADO</span>
                  <span>{filtered[0].category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].readMinutes} min</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4 leading-tight">{filtered[0].title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{filtered[0].excerpt}</p>
                <span className="text-rose-500 font-bold text-sm">Leer artículo →</span>
              </div>
            </button>
          </section>
        )}

        {/* Active filter heading */}
        {activeCategory && (
          <div className="max-w-7xl mx-auto px-6 mb-6">
            <p className="text-sm text-gray-500">
              Mostrando <strong className="text-gray-900">{filtered.length}</strong> {filtered.length === 1 ? "artículo" : "artículos"} de la categoría <strong className="text-rose-500">{activeCategory}</strong>
            </p>
          </div>
        )}

        {/* Grid of posts */}
        <section className="max-w-7xl mx-auto px-6">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No hay artículos en esta categoría aún.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory ? filtered : filtered.slice(1)).map(post => (
                <button
                  key={post.slug}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group text-left bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/30 transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={post.image} alt={post.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2 text-[11px] text-gray-400 font-medium">
                      <span className="text-rose-500 font-bold uppercase">{post.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readMinutes} min</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-rose-600 transition-colors">{post.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">{post.excerpt}</p>
                    <span className="mt-auto text-rose-500 font-bold text-xs">Leer más →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* CTA bottom */}
        <section className="max-w-7xl mx-auto px-6 mt-20">
          <div className="bg-gray-900 rounded-[3rem] p-12 text-center text-white">
            <h2 className="text-3xl font-black mb-6">¿Lista para tu próxima manicura?</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">Aplica los consejos de nuestro blog reservando una cita con nuestras profesionales en NAILOX, Barcelona.</p>
            <button onClick={() => navigate("/reservar")} className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-rose-900/20">
              Reservar Mi Cita
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
