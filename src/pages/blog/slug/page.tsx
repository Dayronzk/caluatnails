import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, Clock, Calendar, ArrowRight } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/data/blogPosts";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Helmet>
          <title>Artículo no encontrado | NAILOX</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href="https://www.nailox.com/blog" />
        </Helmet>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Artículo no encontrado</h1>
        <p className="text-gray-500 mb-8">El artículo que buscas no existe o ha cambiado de URL.</p>
        <button onClick={() => navigate("/blog")} className="bg-rose-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all">
          Volver al blog
        </button>
      </div>
    );
  }

  const related = getRelatedPosts(post.slug, 3);
  const canonical = `https://www.nailox.com/blog/${post.slug}`;
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const wordCount = post.content.reduce((acc, b) => {
    if (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "callout") return acc + b.text.split(/\s+/).length;
    if (b.type === "ul" || b.type === "ol") return acc + b.items.join(" ").split(/\s+/).length;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-white font-inter">
      <Helmet>
        <title>{post.title} | NAILOX Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.keywords} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonical} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={`https://www.nailox.com${post.image}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="NAILOX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={`https://www.nailox.com${post.image}`} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.nailox.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.nailox.com/blog" },
                  { "@type": "ListItem", "position": 3, "name": post.title, "item": canonical },
                ],
              },
              {
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "image": {
                  "@type": "ImageObject",
                  "url": `https://www.nailox.com${post.image}`,
                  "width": 1200,
                  "height": 630,
                },
                "datePublished": post.publishedAt,
                "dateModified": post.publishedAt,
                "author": {
                  "@type": "Organization",
                  "@id": "https://www.nailox.com/#organization",
                  "name": "Equipo NAILOX",
                  "url": "https://www.nailox.com/",
                },
                "publisher": { "@id": "https://www.nailox.com/#organization" },
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
                "articleSection": post.category,
                "inLanguage": "es",
                "keywords": post.keywords,
                "wordCount": wordCount,
                "timeRequired": `PT${post.readMinutes}M`,
                "isAccessibleForFree": true,
                "about": {
                  "@type": "Thing",
                  "name": "Manicura y pedicura profesional en Barcelona",
                },
                "isPartOf": {
                  "@type": "Blog",
                  "@id": "https://www.nailox.com/blog#blog",
                  "name": "Blog NAILOX",
                  "url": "https://www.nailox.com/blog",
                },
              },
            ],
          })}
        </script>
      </Helmet>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/blog")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Blog</span>
          </button>
          <span className="font-playfair text-xl font-bold tracking-widest text-gray-900">
            NAIL<span className="text-rose-400">OX</span>
          </span>
          <button onClick={() => navigate("/reservar")} className="bg-rose-500 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">
            RESERVAR
          </button>
        </div>
      </nav>

      <article className="pt-24 pb-20">
        {/* Hero */}
        <header className="max-w-4xl mx-auto px-6 mb-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <button onClick={() => navigate("/")} className="hover:text-rose-500">Inicio</button>
            <span>›</span>
            <button onClick={() => navigate("/blog")} className="hover:text-rose-500">Blog</button>
            <span>›</span>
            <span className="text-gray-600">{post.category}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full font-bold uppercase tracking-widest">{post.category}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formattedDate}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readMinutes} min de lectura</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">{post.title}</h1>
          <p className="text-lg lg:text-xl text-gray-500 leading-relaxed">{post.excerpt}</p>
        </header>

        {/* Featured image */}
        <div className="max-w-5xl mx-auto px-6 mb-12">
          <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-xl">
            <img src={post.image} alt={post.imageAlt} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 prose prose-rose prose-lg">
          {post.content.map((block, i) => {
            switch (block.type) {
              case "p":
                return <p key={i} className="text-gray-700 text-base lg:text-lg leading-relaxed mb-5">{block.text}</p>;
              case "h2":
                return <h2 key={i} className="text-2xl lg:text-3xl font-black text-gray-900 mt-12 mb-4 leading-tight">{block.text}</h2>;
              case "h3":
                return <h3 key={i} className="text-xl lg:text-2xl font-bold text-gray-900 mt-8 mb-3">{block.text}</h3>;
              case "ul":
                return (
                  <ul key={i} className="space-y-3 mb-6 pl-0">
                    {block.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-700 text-base lg:text-lg leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-rose-400 mt-2.5 shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              case "ol":
                return (
                  <ol key={i} className="space-y-3 mb-6 pl-0">
                    {block.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-700 text-base lg:text-lg leading-relaxed">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">{j + 1}</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ol>
                );
              case "callout":
                return (
                  <aside key={i} className="my-8 p-6 bg-rose-50 border-l-4 border-rose-400 rounded-r-2xl">
                    <p className="text-rose-900 font-semibold leading-relaxed">💡 {block.text}</p>
                  </aside>
                );
              case "cta":
                return (
                  <div key={i} className="my-10 p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl text-center">
                    <p className="text-white text-xl font-bold mb-5">{block.text}</p>
                    <button
                      onClick={() => navigate(block.href)}
                      className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl"
                    >
                      {block.label} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                );
              default:
                return null;
            }
          })}

          {/* Author / signature */}
          <div className="mt-16 pt-8 border-t border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-black text-xl">N</div>
            <div>
              <p className="font-bold text-gray-900">Equipo NAILOX</p>
              <p className="text-sm text-gray-500">Salón de manicura y pedicura premium · Eixample, Barcelona</p>
            </div>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mt-20">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-8 uppercase tracking-tight">Sigue leyendo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(r => (
                <button
                  key={r.slug}
                  onClick={() => { navigate(`/blog/${r.slug}`); window.scrollTo(0, 0); }}
                  className="group text-left bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={r.image} alt={r.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <span className="text-[11px] text-rose-500 font-bold uppercase">{r.category}</span>
                    <h3 className="text-base font-bold text-gray-900 mt-2 line-clamp-2 group-hover:text-rose-600 transition-colors">{r.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 mt-20">
          <div className="bg-gray-900 rounded-[3rem] p-12 text-center text-white">
            <h2 className="text-3xl font-black mb-4">¿Aplicamos esto en tus uñas?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">Reserva tu cita en NAILOX y deja que nuestras profesionales te asesoren.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/reservar")} className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-full font-bold text-base transition-all">
                Reservar Cita
              </button>
              <button onClick={() => navigate("/servicios")} className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-8 py-4 rounded-full font-bold text-base transition-all">
                Ver Servicios
              </button>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
