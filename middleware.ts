// Detect bots that only read initial HTML (WhatsApp, Telegram, etc.)
const BOT_USER_AGENTS = [
  'WhatsApp',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'googlebot',
  'bingbot',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterestbot',
  'redditbot',
  'Applebot',
  'embedly',
  'quora link preview',
  'Outlook',
  'vkShare',
  'W3C_Validator',
];

// Available salon images (in /public/assets/)
const IMG = {
  premium: 'https://www.nailox.com/assets/manicure-premium.png',
  pastel: 'https://www.nailox.com/assets/manicure-pastel.jpg',
  exotic: 'https://www.nailox.com/assets/manicure-exotic.jpg',
  pedicure: 'https://www.nailox.com/assets/pedicure-luxury.jpg',
  extensions: 'https://www.nailox.com/assets/extensions-premium.png',
  fallback: 'https://www.nailox.com/assets/service-fallback.png',
};

export const config = {
  matcher: [
    '/',
    '/servicios',
    '/servicios/:slug*',
    '/profesionales',
    '/reservar',
    '/tienda/:path*',
    '/certificado/:path*',
    '/login',
    '/registro',
    '/faq',
    '/contacto',
    '/privacidad',
    '/terminos',
    '/blog',
    '/blog/:slug*',
    '/tarjeta-regalo',
    '/tarjeta-regalo/:path*',
    '/promociones',
    '/sede-eixample',
    '/mi-cuenta',
    '/mis-citas',
    '/recuperar',
    '/nueva-contrasena',
    '/confirmar-email',

    // Legacy WordPress / theme paths → handled by 410 Gone block in middleware()
    '/category/:path*',
    '/tag/:path*',
    '/author/:path*',
    '/wp-content/:path*',
    '/wp-includes/:path*',
    '/wp-json/:path*',
    '/cgi-bin/:path*',
    '/xmlrpc.php',
    '/trackback',
    '/trackback/:path*',
  ],
};

// Permanently-gone URLs inherited from a previous WordPress install or theme.
// Returning 410 tells Google to deindex faster than 404.
const GONE_PATH_PREFIXES = [
  '/category/',
  '/tag/',
  '/author/',
  '/wp-content/',
  '/wp-includes/',
  '/wp-json/',
  '/cgi-bin/',
  '/trackback',
];

const GONE_EXACT_PATHS = new Set<string>([
  '/xmlrpc.php',
  '/wp-config.php',
  '/wp-cron.php',
]);

const GONE_QUERY_KEYS = ['rivax-template', 'replytocom', 'attachment_id'];

function goneResponse(): Response {
  return new Response(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>410 — Contenido eliminado</title><meta name="robots" content="noindex,nofollow"></head><body><h1>410 Gone</h1><p>Este contenido se ha retirado de forma permanente.</p><p><a href="https://www.nailox.com/">Volver al inicio</a></p></body></html>',
    {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=86400',
        'x-robots-tag': 'noindex, nofollow',
      },
    },
  );
}

// Blog posts metadata for social previews (must match src/data/blogPosts.ts)
const BLOG_POSTS: Record<string, { title: string; description: string; image: string }> = {
  'manicura-para-boda-en-barcelona-guia-2026': {
    title: 'Manicura para boda en Barcelona: guía completa 2026',
    description: 'Todo lo que necesitas saber para tener unas uñas perfectas el día de tu boda: tipos de manicura, tiempos, colores tendencia y precios en Barcelona.',
    image: '/assets/manicure-premium.png',
  },
  'cuanto-cuesta-la-manicura-semipermanente-en-barcelona': {
    title: '¿Cuánto cuesta la manicura semipermanente en Barcelona en 2026?',
    description: 'Precios reales del esmaltado semipermanente en Barcelona, factores que influyen, qué incluye y cómo elegir un salón profesional sin sustos.',
    image: '/assets/manicure-pastel.jpg',
  },
  'diferencias-entre-unas-en-gel-y-acrilico': {
    title: 'Uñas en gel vs acrílico: diferencias, ventajas y cuál elegir',
    description: 'Análisis completo de las diferencias entre uñas en gel y uñas acrílicas: duración, naturalidad, mantenimiento, precio y cuándo usar cada una.',
    image: '/assets/manicure-exotic.jpg',
  },
  'cuidados-despues-de-pedicura-semipermanente': {
    title: 'Cuidados después de pedicura semipermanente: la guía definitiva',
    description: 'Cómo hacer durar tu pedicura semipermanente hasta 5 semanas: rutina diaria, errores que destruyen el esmalte y cuándo retocarla.',
    image: '/assets/pedicure-luxury.jpg',
  },
  'manicura-rusa-vs-japonesa-diferencias': {
    title: 'Manicura rusa vs japonesa: diferencias y cuál te conviene',
    description: 'Dos técnicas asiáticas que están revolucionando la manicura profesional: descubre sus diferencias, ventajas y para quién es cada una.',
    image: '/assets/manicure-premium.png',
  },
  'mejor-manicura-cerca-de-sagrada-familia': {
    title: 'Mejor manicura cerca de Sagrada Familia: qué buscar y dónde reservar',
    description: 'Si vives o trabajas cerca de la Sagrada Familia y buscas manicura profesional, esta guía te ayuda a elegir bien sin gastar de más.',
    image: '/assets/manicure-pastel.jpg',
  },
  'como-elegir-largo-y-forma-de-unas-perfecto': {
    title: 'Cómo elegir el largo y forma de uñas perfecto para tus manos',
    description: 'Almendra, cuadrada, stiletto, ballerina, ovalada... Te explicamos qué forma estiliza más cada tipo de mano y cómo decidir el largo ideal.',
    image: '/assets/manicure-exotic.jpg',
  },
  'pedicura-en-embarazo-precauciones': {
    title: 'Pedicura en embarazo: qué precauciones tomar y cuándo evitarla',
    description: '¿Es seguro hacerse la pedicura embarazada? Sí, con precauciones. Te contamos qué evitar, cuándo es ideal y por qué tu salón debe saber que estás esperando.',
    image: '/assets/pedicure-luxury.jpg',
  },
  'tendencias-de-unas-2026': {
    title: 'Tendencias de uñas 2026: los 10 estilos que arrasarán este año',
    description: 'De los nudes minimalistas al chrome aurora pasando por el francés moderno: aquí están las 10 tendencias de uñas que verás por todas partes en 2026.',
    image: '/assets/manicure-exotic.jpg',
  },
  'como-cuidar-las-cuticulas-en-casa': {
    title: 'Cómo cuidar las cutículas en casa: rutina y errores comunes',
    description: 'Las cutículas son la barrera natural de tus uñas. Te explicamos cómo cuidarlas correctamente en casa para uñas más fuertes, sanas y bonitas.',
    image: '/assets/manicure-pastel.jpg',
  },
  'manicura-para-deportistas': {
    title: 'Manicura para deportistas: técnicas que aguantan el gimnasio',
    description: 'Levantar pesas, hacer crossfit, escalar... ¿qué manicura aguanta tu entrenamiento? Te lo contamos sin engaños.',
    image: '/assets/manicure-premium.png',
  },
  'errores-al-retirar-esmaltado-en-casa': {
    title: 'Errores comunes al retirar el esmaltado en casa (y cómo evitarlos)',
    description: 'Retirar el esmaltado semipermanente o el gel en casa puede arruinar tu uña natural si no sabes cómo. Esta guía te ahorra meses de uñas dañadas.',
    image: '/assets/manicure-pastel.jpg',
  },
  'como-hidratar-manos-en-invierno': {
    title: 'Cómo hidratar las manos en invierno: rutina y productos clave',
    description: 'El frío reseca las manos y agrieta la piel alrededor de las uñas. Te enseñamos cómo proteger y reparar tus manos durante los meses más duros.',
    image: '/assets/manicure-pastel.jpg',
  },
  'nail-art-minimalista-10-disenos-faciles': {
    title: 'Nail art minimalista: 10 diseños fáciles que quedan de lujo',
    description: 'No hace falta saber pintar para tener uñas espectaculares. Estos 10 diseños minimalistas son sencillos, modernos y favorecen cualquier ocasión.',
    image: '/assets/manicure-exotic.jpg',
  },
  'manicura-para-evento-corporativo': {
    title: 'Manicura para evento corporativo: elegancia profesional sin pasarte',
    description: 'Una entrevista, conferencia, reunión importante o evento de empresa. Tu manicura comunica tanto como tu ropa. Te ayudamos a elegir bien.',
    image: '/assets/manicure-premium.png',
  },
  'como-elegir-el-color-de-esmalte-segun-tu-tono-de-piel': {
    title: 'Cómo elegir el color de esmalte según tu tono de piel',
    description: 'Los colores que potencian tus manos no son los mismos para todas. Te enseñamos a identificar tu subtono de piel y elegir los esmaltes que mejor te quedan.',
    image: '/assets/blog/nail-polish.jpg',
  },
  'uñas-fuertes-de-forma-natural-trucos-y-alimentacion': {
    title: 'Uñas fuertes de forma natural: trucos y alimentación que funcionan',
    description: 'Si tus uñas se rompen, se descaman o crecen lentamente, el problema empieza dentro. Aquí los consejos respaldados por nutricionistas y nuestras técnicas.',
    image: '/assets/blog/nail-care.jpg',
  },
  'cuanto-dura-cada-tipo-de-manicura-tabla-comparativa': {
    title: '¿Cuánto dura cada tipo de manicura? Tabla comparativa real',
    description: 'Manicura tradicional, semipermanente, con nivelación, en gel, acrílica... Te decimos exactamente cuánto dura cada una con datos reales del salón.',
    image: '/assets/blog/nails-pink.jpg',
  },
  'rutina-de-belleza-de-manos-completa-paso-a-paso': {
    title: 'Rutina de belleza de manos completa: paso a paso semanal',
    description: 'Tus manos envejecen más rápido que tu cara y se notan más. Esta rutina semanal probada las mantiene jóvenes, suaves y con uñas espectaculares.',
    image: '/assets/blog/hand-cream.jpg',
  },
  'francesa-moderna-2026-variantes-tendencia': {
    title: 'Francesa moderna 2026: 8 variantes que reinventan el clásico',
    description: 'El francés clásico ha vuelto, pero reinventado. Líneas finas de color, base nude, micro-glitter... Aquí las 8 variantes que arrasan en Barcelona.',
    image: '/assets/blog/nails-french.jpg',
  },
  'manicura-de-verano-2026-colores-y-disenos': {
    title: 'Manicura de verano 2026: colores y diseños que arrasan',
    description: 'Llega el calor y con él los nuevos colores. Descubre las tendencias de manicura para este verano: del coral fluor al verde menta pasando por el efecto piscina.',
    image: '/assets/blog/summer-nails.jpg',
  },
  'manicura-de-invierno-colores-y-cuidados-en-frio': {
    title: 'Manicura de invierno: colores cálidos y cuidados especiales',
    description: 'El frío reseca las uñas y las hace frágiles. Te contamos los colores que mejor lucen en invierno y cómo proteger tus uñas en los meses más duros.',
    image: '/assets/blog/winter-nails.jpg',
  },
  'manicura-roja-clasica-el-color-que-nunca-falla': {
    title: 'Manicura roja clásica: el color que nunca falla',
    description: 'El rojo en las uñas es atemporal. Pero no todos los rojos son iguales. Te enseñamos a elegir el rojo perfecto según ocasión, piel y estilo.',
    image: '/assets/blog/red-nails.jpg',
  },
  'uñas-nude-la-elegancia-del-minimalismo': {
    title: 'Uñas nude: la elegancia del minimalismo',
    description: 'Las uñas nude son las más solicitadas en NAILOX. Discretas, elegantes, profesionales. Te enseñamos a elegir el nude exacto que favorece tus manos.',
    image: '/assets/blog/nude-nails.jpg',
  },
  'uñas-con-glitter-cuando-y-como-usarlo-con-estilo': {
    title: 'Uñas con glitter: cuándo y cómo usarlo con estilo',
    description: 'El glitter puede ser elegante o hortera. La diferencia está en saberlo usar. Te explicamos cuándo, cómo y en qué cantidad luce siempre fabuloso.',
    image: '/assets/blog/glitter-nails.jpg',
  },
  'manicura-de-novia-paso-a-paso-y-checklist': {
    title: 'Manicura de novia paso a paso: checklist y planning completo',
    description: 'Una guía cronológica desde 3 meses antes hasta el día D. Qué hacer, cuándo, qué evitar y cómo asegurar unas manos perfectas en tu boda.',
    image: '/assets/blog/wedding-nails.jpg',
  },
  'pedicura-spa-en-casa-receta-completa': {
    title: 'Pedicura spa en casa: receta paso a paso para pies de revista',
    description: 'Aprende a hacerte una pedicura spa profesional en casa: ingredientes, materiales y proceso completo en 45 minutos.',
    image: '/assets/blog/spa-nails.jpg',
  },
  'uñas-cromadas-tecnica-cuidados-y-mantenimiento': {
    title: 'Uñas cromadas: técnica, cuidados y mantenimiento profesional',
    description: 'El efecto espejo en las uñas no para de subir. Te explicamos cómo se consigue, qué duración tienen y cuándo es la mejor opción.',
    image: '/assets/blog/chrome-nails.jpg',
  },
  'como-elegir-tu-salon-de-uñas-15-señales-clave': {
    title: 'Cómo elegir tu salón de uñas: 15 señales que delatan calidad',
    description: '¿Salón profesional o catastrófico? Estas 15 señales te ayudan a decidir antes de sentarte. Imprescindible para evitar daños permanentes.',
    image: '/assets/blog/manicure-tools.jpg',
  },
  'tratamientos-para-uñas-encarnadas-prevencion-y-solucion': {
    title: 'Uñas encarnadas: prevención, soluciones y cuándo ir al médico',
    description: 'Las uñas encarnadas son dolorosas y pueden infectarse. Te explicamos cómo prevenirlas, cómo tratar las primeras señales y cuándo necesitas un podólogo.',
    image: '/assets/blog/feet-care.jpg',
  },
  'color-block-uñas-combinaciones-que-arrasan': {
    title: "Color block en uñas: combinaciones que arrasan en 2026",
    description: "La técnica color block reinventa cualquier manicura. Te enseñamos las combinaciones que funcionan, las que no y cómo aplicarlas según tu estilo.",
    image: '/assets/blog/color-block.jpg',
  },
  'nail-art-con-piedras-y-pedreria-con-elegancia': {
    title: "Nail art con piedras y pedrería: cómo usarla con elegancia",
    description: "La pedrería puede subir tu manicura a otro nivel o convertirla en un disfraz. Esta es la guía profesional para usarla con clase.",
    image: '/assets/blog/gems-nails.jpg',
  },
  'uñas-holograficas-tendencia-que-no-para': {
    title: "Uñas holográficas: la tendencia que no para de crecer",
    description: "El efecto holográfico cambia con la luz. Te contamos qué es exactamente, cómo se aplica y por qué tantas mujeres lo están eligiendo.",
    image: '/assets/blog/holographic.jpg',
  },
  'uñas-para-san-valentin-ideas-romanticas': {
    title: "Uñas para San Valentín: 10 ideas románticas (sin pasarse)",
    description: "Corazones, rojos, rosas... San Valentín es la excusa perfecta para una manicura especial. Estas 10 ideas funcionan sin caer en el cliché.",
    image: '/assets/blog/valentine-nails.jpg',
  },
  'manicura-en-tonos-pastel-elegancia-fresca': {
    title: "Manicura en tonos pastel: elegancia fresca para cualquier ocasión",
    description: "Los pasteles son la opción perfecta cuando quieres color sin estridencia. Te enseñamos a combinarlos para un resultado siempre elegante.",
    image: '/assets/blog/nails-pink.jpg',
  },
  'identificar-problemas-en-tus-uñas-señales-clave': {
    title: "Cómo identificar problemas en tus uñas: señales que no debes ignorar",
    description: "Manchas blancas, líneas verticales, color amarillento, hongos... aprende a reconocer las señales que indican algo más que estética.",
    image: '/assets/blog/nail-problems.jpg',
  },
  'mascarillas-caseras-para-manos-top-7-recetas': {
    title: "Mascarillas caseras para manos: top 7 recetas que funcionan",
    description: "Manos secas, agrietadas o castigadas por el frío. Estas 7 mascarillas caseras hechas con ingredientes que tienes en casa las regeneran en minutos.",
    image: '/assets/blog/mask-hands.jpg',
  },
  'cuidado-uñas-en-deporte-intenso': {
    title: "Cuidado de uñas en deporte intenso: protege tus manos",
    description: "Crossfit, escalada, halterofilia, golf... los deportes que dañan más las uñas y cómo protegerlas sin renunciar al rendimiento.",
    image: '/assets/blog/sport-nails.jpg',
  },
  'manicura-despues-del-parto-cuando-y-como': {
    title: "Manicura después del parto: cuándo y cómo retomarla",
    description: "Tras el embarazo, tus uñas y manos cambian. Te explicamos cuándo es seguro volver a la manicura semipermanente y cómo cuidar las manos post-parto.",
    image: '/assets/blog/postpartum.jpg',
  },
  'estriado-de-uñas-causas-y-soluciones': {
    title: "Estriado de uñas: causas y soluciones efectivas",
    description: "Las líneas verticales en las uñas son comunes con la edad, pero se pueden suavizar. Te contamos por qué aparecen y cómo tratarlas.",
    image: '/assets/blog/ridged-nails.jpg',
  },
  'costo-real-mantener-uñas-perfectas-todo-el-año-barcelona': {
    title: "Costo real de mantener uñas perfectas todo el año en Barcelona",
    description: "Hacemos las cuentas: cuánto gastas realmente en uñas si quieres tenerlas perfectas durante 12 meses en Barcelona. Sin trampa ni cartón.",
    image: '/assets/blog/money-nails.jpg',
  },
  'salones-low-cost-vs-premium-comparativa-real': {
    title: "Salones low-cost vs premium: comparativa real para que no te engañen",
    description: "¿Vale 10€ o 35€ una manicura? Te enseñamos las diferencias REALES entre un salón low-cost y uno premium, sin marketing.",
    image: '/assets/blog/lowcost.jpg',
  },
  'vale-la-pena-pagar-mas-por-manicura-profesional': {
    title: "¿Vale la pena pagar más por una manicura profesional? Sinceramente",
    description: "Hablemos claro: una manicura profesional cuesta el doble o el triple que una rápida. ¿Qué obtienes por esa diferencia? Análisis honesto.",
    image: '/assets/blog/money-nails.jpg',
  },
  'cuanto-gastar-al-mes-en-uñas-presupuesto-razonable': {
    title: "Cuánto gastar al mes en uñas: presupuesto razonable según estilo de vida",
    description: "¿20€, 50€ o 100€? Te ayudamos a decidir cuánto presupuesto destinar a tus uñas según tu rutina, ocasiones y prioridades.",
    image: '/assets/blog/money-nails.jpg',
  },
  'bonos-y-abonos-manicura-son-rentables': {
    title: "Bonos y abonos de manicura: ¿son realmente rentables?",
    description: "Los packs de varias sesiones suenan a chollo. Te enseñamos a calcular si realmente te ahorran dinero y cuándo conviene.",
    image: '/assets/blog/money-nails.jpg',
  },
  'manicura-para-invitada-de-boda-8-ideas': {
    title: "Manicura para invitada de boda: 8 ideas elegantes sin pasarse",
    description: "Vas a una boda. ¿Qué manicura llevas? Te damos 8 ideas que se ven elegantes en fotos y combinan con cualquier vestido.",
    image: '/assets/blog/wedding-guest.jpg',
  },
  'despedidas-de-soltera-manicura-grupal-barcelona': {
    title: "Despedidas de soltera: manicura grupal en Barcelona, todo incluido",
    description: "Las despedidas de soltera modernas incluyen manicura grupal con cava. Te contamos cómo organizarlas en Barcelona y precios reales.",
    image: '/assets/blog/wedding-nails.jpg',
  },
  'manicura-bautizo-comunion-celebraciones': {
    title: "Manicura para bautizo, comunión y otras celebraciones familiares",
    description: "Las celebraciones familiares requieren elegancia discreta. Te damos las claves para una manicura impecable que combine con cada tipo de evento.",
    image: '/assets/blog/nails-pink.jpg',
  },
  'uñas-para-fotos-profesionales-que-pedir': {
    title: "Uñas para fotos profesionales: qué pedir y qué evitar",
    description: "Sesión de fotos de empresa, family shooting, retrato profesional... Tus uñas saldrán en primer plano. Te enseñamos qué pedir.",
    image: '/assets/manicure-premium.png',
  },
  'manicura-fin-de-año-celebraciones-navidenas': {
    title: "Manicura para fin de año y celebraciones navideñas",
    description: "Las fechas navideñas son la mejor excusa para una manicura especial. Te damos las ideas que arrasan en cena de empresa, Nochebuena y Nochevieja.",
    image: '/assets/blog/glitter-nails.jpg',
  },
  'biab-builder-in-a-bottle-tecnica-tendencia': {
    title: "BIAB (Builder in a Bottle): la técnica que está conquistando los salones",
    description: "BIAB es la palabra de moda en el mundo de la manicura. Te explicamos qué es exactamente, en qué se diferencia del gel y por qué tantas profesionales la prefieren.",
    image: '/assets/blog/biab.jpg',
  },
  'top-coat-brillante-vs-mate-diferencias-cuando-usar': {
    title: "Top coat brillante vs mate: diferencias y cuándo usar cada uno",
    description: "El top coat es la última capa pero hace toda la diferencia. Te explicamos cuándo elegir brillante, cuándo mate y trucos para que dure más.",
    image: '/assets/blog/matte-nails.jpg',
  },
  'tipos-de-bases-cual-usar-para-tu-uña': {
    title: "Tipos de bases para uñas: cuál usar según tu necesidad",
    description: "No todas las bases son iguales. Rubber base, builder base, base regular... Te enseñamos cuál es la mejor según tu uña natural.",
    image: '/assets/blog/manicure-tools.jpg',
  },
  'polygel-ventajas-y-desventajas': {
    title: "Polygel: ventajas y desventajas que debes saber antes de hacértelo",
    description: "El polygel es híbrido entre acrílico y gel. Promete lo mejor de ambos, pero tiene matices. Te lo contamos sin filtros.",
    image: '/assets/blog/polygel.jpg',
  },
  'decoracion-3d-en-uñas-tecnicas-profesionales': {
    title: "Decoración 3D en uñas: técnicas profesionales para llevar tus uñas al siguiente nivel",
    description: "Mariposas, flores, charms, pedrería 3D... Te enseñamos las técnicas profesionales que convierten una manicura en una obra de arte.",
    image: '/assets/blog/nail-art-1.jpg',
  },
  'mejores-barrios-para-manicura-barcelona': {
    title: "Mejores barrios para hacerte la manicura en Barcelona: guía 2026",
    description: "¿Dónde está la mejor oferta de salones de uñas en Barcelona? Análisis barrio por barrio con precios, calidad y especialidades.",
    image: '/assets/blog/barcelona-city.jpg',
  },
  'manicura-en-eixample-por-que-es-la-zona-top': {
    title: "Manicura en el Eixample: por qué es la zona top de Barcelona",
    description: "El Eixample concentra los mejores salones de Barcelona. Te contamos por qué y qué buscar al elegir un salón en esta zona icónica.",
    image: '/assets/blog/eixample.jpg',
  },
  'manicura-cerca-passeig-de-gracia-opciones': {
    title: "Manicura cerca de Passeig de Gràcia: opciones premium y cómo elegir",
    description: "Si haces shopping por Passeig de Gràcia y quieres combinarlo con manicura, te contamos las opciones cercanas y cómo elegir bien.",
    image: '/assets/blog/barcelona-city.jpg',
  },
  'salones-uñas-gracia-guia-completa': {
    title: "Salones de uñas en Gràcia: guía completa con tipos y precios",
    description: "Gràcia es uno de los barrios más vivos de Barcelona. Aquí los tipos de salones que encontrarás, sus precios y cómo elegir el adecuado para ti.",
    image: '/assets/blog/barcelona-city.jpg',
  },
  'manicura-express-barcelona-cuando-conviene': {
    title: "Manicura express en Barcelona: cuándo conviene y cuándo no",
    description: "Las manicuras express duran 20-30 minutos y son baratas. Pero no siempre son la mejor opción. Te enseñamos cuándo elegirlas.",
    image: '/assets/blog/express-nails.jpg',
  },
  'manicura-profesionales-sanitarias-opciones-permitidas': {
    title: "Manicura para profesionales sanitarias: qué se permite y qué no",
    description: "Las enfermeras, médicas y auxiliares tienen restricciones en uñas por higiene. Te decimos qué manicura puedes llevar sin saltarte el protocolo.",
    image: '/assets/blog/healthcare-nails.jpg',
  },
  'uñas-para-auxiliares-de-vuelo-protocolo-y-belleza': {
    title: "Uñas para auxiliares de vuelo: equilibrio entre protocolo y belleza",
    description: "Las tripulantes de cabina tienen normas estrictas pero también imagen impecable. Te enseñamos cómo combinar ambas.",
    image: '/assets/blog/nude-nails.jpg',
  },
  'manicura-para-embarazadas-permitido-y-prohibido': {
    title: "Manicura para embarazadas: qué se permite y qué evitar",
    description: "El embarazo no es excusa para descuidar tus manos. Te decimos qué tipos de manicura son 100% seguras y cuáles conviene posponer.",
    image: '/assets/blog/nails-pink.jpg',
  },
  'uñas-para-mamas-practicidad-y-elegancia': {
    title: "Uñas para mamás: practicidad y elegancia (sí, es posible)",
    description: "Las mamás tienen las manos en todo: pañales, baños, juguetes... Te enseñamos las manicuras que aguantan y se ven preciosas.",
    image: '/assets/blog/mom-nails.jpg',
  },
  'manicura-para-profesionales-cocina': {
    title: "Manicura para profesionales de la cocina: posible sin saltarse normas",
    description: "Cocineras, reposteras, camareras... la higiene es ley. Te enseñamos las opciones de manicura que respetan las normas y se ven bien.",
    image: '/assets/blog/natural-nails.jpg',
  },
  'tendencias-unas-verano-2026-barcelona': {
    title: "Tendencias en uñas para el verano 2026 en Barcelona",
    description: "Los colores, técnicas y diseños que van a triunfar este verano 2026 en Barcelona: de los tonos pastel a las uñas chrome.",
    image: '/assets/blog/summer-bcn-2026.jpg',
  },
  'manicura-coreana-glass-nails-barcelona': {
    title: "Manicura coreana en Barcelona: glass nails y efecto dewy",
    description: "Descubre la manicura coreana que arrasa en Asia y empieza a triunfar en España. Glass nails, milk nails y diseños minimalistas que enamoran.",
    image: '/assets/blog/minimal-nails.jpg',
  },
  'unas-festivales-verano-2026-primavera-sound-sonar': {
    title: "Uñas para festivales de verano 2026: Primavera Sound, Sónar y más",
    description: "Llega la temporada de festivales en Barcelona. Te contamos qué manicura aguanta sudor, baile y polvo durante 3 días seguidos sin perder su brillo.",
    image: '/assets/blog/festival-nails.jpg',
  },
  'como-cuidar-unas-piscina-mar-verano': {
    title: "Cómo cuidar tus uñas con piscina y mar este verano (guía 2026)",
    description: "El cloro de la piscina y la sal del mar pueden destrozar tu manicura. Te enseñamos a proteger tus uñas y prolongar la duración del esmalte semipermanente.",
    image: '/assets/blog/pool-nails.jpg',
  },
  'biab-vs-gel-vs-acrilico-cual-elegir-2026': {
    title: "BIAB vs gel vs acrílico: ¿cuál elegir en 2026?",
    description: "Comparativa honesta entre las tres técnicas más populares de uñas. Te ayudamos a elegir según tu tipo de uña, estilo de vida y presupuesto.",
    image: '/assets/blog/biab-comparison.jpg',
  },
  'manicura-clean-girl-aesthetic-2026': {
    title: "Manicura clean girl aesthetic: la tendencia 2026 que arrasa en TikTok",
    description: "El estilo clean girl apuesta por uñas naturales, saludables y minimalistas. Todo sobre la tendencia que domina las redes sociales en 2026.",
    image: '/assets/blog/clean-girl.jpg',
  },
  'pedicura-completa-antes-viajar-playa': {
    title: "Pedicura completa antes de viajar a la playa: por qué es imprescindible",
    description: "Llega el verano y con él las sandalias. Te explicamos qué incluye una pedicura completa profesional y por qué deberías hacértela antes de tu próximo viaje.",
    image: '/assets/blog/pedi-travel.jpg',
  },
  'unas-chrome-aurora-tendencia-viral': {
    title: "Uñas chrome aurora: la tendencia viral que arrasa en 2026",
    description: "Las uñas chrome aurora, con efecto holográfico cambiante, se han vuelto virales. Te contamos cómo se hacen, cuánto duran y dónde conseguirlas en Barcelona.",
    image: '/assets/blog/chrome-aurora.jpg',
  },
  'manicura-express-barcelona-30-minutos': {
    title: "Manicura express en Barcelona: 30 minutos para lucir perfecta",
    description: "¿Tienes solo media hora libre? Te contamos qué incluye una manicura express, cuándo es la mejor opción y dónde hacerla rápido en Barcelona.",
    image: '/assets/blog/express-30min.jpg',
  },
  'unas-fotos-tendencias-camara-2026': {
    title: "Uñas para fotos: las tendencias que se ven mejor en cámara",
    description: "Algunas manicuras son preciosas en persona pero pierden brillo en fotos. Te contamos qué estilos se fotografían mejor y cómo prepararte para una sesión.",
    image: '/assets/blog/photo-nails.jpg',
  },
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1) Hard 410 for legacy WordPress / theme URLs Google may still try to crawl.
  if (
    GONE_EXACT_PATHS.has(path) ||
    GONE_PATH_PREFIXES.some(prefix => path === prefix.replace(/\/$/, '') || path.startsWith(prefix)) ||
    GONE_QUERY_KEYS.some(key => url.searchParams.has(key))
  ) {
    return goneResponse();
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));

  if (!isBot) return undefined;

  let title = 'NAILOX';
  let image = IMG.premium;
  let description = 'Salón de manicura y pedicura premium en el Eixample, Barcelona. Reserva online tu cita.';

  if (path.startsWith('/servicios/')) {
    const slug = path.split('/').pop() || '';

    // Image based on service type
    if (slug.includes('pedicura') && !slug.includes('manicura')) {
      image = IMG.pedicure;
    } else if (slug.includes('relleno')) {
      image = IMG.extensions;
    } else if (slug.includes('gel') || slug.includes('extension') || slug.includes('acrilic')) {
      image = IMG.exotic;
    } else if (slug.includes('nivelacion') || slug.includes('nivelaci')) {
      image = IMG.premium;
    } else if (slug.includes('tradicional') || slug.includes('normal')) {
      image = IMG.pastel;
    } else if (slug.includes('semipermanente') || slug.includes('esmaltado')) {
      image = IMG.pastel;
    } else {
      image = IMG.premium;
    }

    // Format human-readable title
    const formattedName = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Unas/g, 'Uñas')
      .replace(/Nivelacion/g, 'Nivelación')
      .replace(/Acrilico/g, 'Acrílico');

    title = `${formattedName} en Barcelona`;
    description = `${formattedName} profesional en NAILOX, Eixample Barcelona. Técnica avanzada, productos premium y resultados de larga duración. Reserva online tu cita.`;
  }
  else if (path === '/servicios') {
    title = 'Servicios de Manicura y Pedicura en Barcelona';
    image = IMG.pastel;
    description = 'Catálogo completo: manicura rusa con nivelación, esmaltado semipermanente, uñas en gel, pedicura spa, packs combinados y más. En el Eixample, Barcelona. Reserva online.';
  }
  else if (path === '/profesionales') {
    title = 'Nuestras Profesionales Certificadas en Barcelona';
    image = IMG.premium;
    description = 'Conoce al equipo de manicuristas profesionales certificadas de NAILOX Barcelona. Especialistas en manicura rusa, uñas en gel y pedicura spa. Reserva con tu favorita.';
  }
  else if (path === '/reservar') {
    title = 'Reserva tu Cita de Manicura y Pedicura en Barcelona';
    image = IMG.premium;
    description = 'Reserva online tu cita en NAILOX, Eixample Barcelona. Manicura, pedicura, uñas en gel y esmaltado semipermanente. Elige servicio, profesional y horario en 30 segundos.';
  }
  else if (path.startsWith('/tienda')) {
    title = 'Tienda de Productos Profesionales para Uñas';
    image = IMG.extensions;
    description = 'Descubre la tienda NAILOX: esmaltes profesionales, geles, kits de manicura, herramientas y productos premium para el cuidado de tus uñas. Envíos a toda España.';
  }
  else if (path.startsWith('/certificado')) {
    title = 'Verificación de Certificado Profesional';
    image = IMG.premium;
    description = 'Verifica la autenticidad de los certificados profesionales emitidos por NAILOX Academia. Más de 3.200 alumnas certificadas en manicura y pedicura.';
  }
  else if (path === '/login') {
    title = 'Iniciar Sesión';
    image = IMG.pastel;
    description = 'Accede a tu cuenta de NAILOX para gestionar tus citas, ver tu historial, consultar tu progreso en el curso o realizar nuevas reservas.';
  }
  else if (path === '/registro') {
    title = 'Crea tu Cuenta';
    image = IMG.pastel;
    description = 'Regístrate gratis en NAILOX y reserva tu primera cita de manicura o pedicura en Barcelona. Acceso a ofertas exclusivas, puntos y referidos.';
  }
  else if (path === '/faq') {
    title = 'Preguntas Frecuentes';
    image = IMG.pastel;
    description = 'Resuelve tus dudas sobre servicios, reservas, precios, ubicación y formas de pago en NAILOX, salón de manicura y pedicura en el Eixample, Barcelona.';
  }
  else if (path === '/contacto') {
    title = 'Contacto · Carrer del Rosselló 497, Barcelona';
    image = IMG.pastel;
    description = 'Contacta con NAILOX en Barcelona: Carrer del Rosselló 497 (Eixample). Teléfono +34 636 68 91 01. Horario L-V 9:00-19:00. WhatsApp disponible.';
  }
  else if (path === '/blog') {
    title = 'Blog NAILOX — Consejos de Manicura y Pedicura en Barcelona';
    image = IMG.premium;
    description = 'Guías, tendencias y consejos profesionales sobre manicura, pedicura, uñas en gel, cuidado de cutículas y más. Por el equipo de NAILOX en Barcelona.';
  }
  else if (path.startsWith('/blog/')) {
    const slug = path.split('/').pop() || '';
    const post = BLOG_POSTS[slug];
    if (post) {
      title = post.title;
      description = post.description;
      image = `https://www.nailox.com${post.image}`;
    } else {
      title = 'Artículo del Blog NAILOX';
      description = 'Lee nuestros consejos profesionales sobre manicura y pedicura en NAILOX, Barcelona.';
    }
  }
  else if (path === '/') {
    title = 'Manicura y Pedicura Profesional en Barcelona (Eixample)';
    image = IMG.premium;
    description = 'Salón premium de manicura y pedicura en el Eixample, Barcelona. Especialistas en manicura con nivelación, esmaltado semipermanente, uñas en gel y pedicura spa. Reserva tu cita online.';
  }
  else if (path === '/tarjeta-regalo' || path.startsWith('/tarjeta-regalo/exito') || path.startsWith('/tarjeta-regalo/cancelado')) {
    title = 'Tarjeta Regalo — Regala Manicura y Pedicura en Barcelona';
    image = IMG.premium;
    description = 'Regala una experiencia NAILOX desde 10€ hasta 500€. Tarjetas regalo válidas 12 meses para cualquier servicio. Entrega por email, SMS, WhatsApp o correo postal. Ideal para cumpleaños, aniversarios o detalles.';
  }
  else if (path.startsWith('/tarjeta-regalo/aportacion/')) {
    title = 'Aporta a una Tarjeta Regalo Grupal NAILOX';
    image = IMG.premium;
    description = 'Contribuye a una tarjeta regalo grupal. Suma tu aporte para regalar una experiencia de manicura o pedicura profesional en Barcelona. Pago seguro y sin registro.';
  }
  else if (path === '/promociones') {
    title = 'Promociones y Descuentos en NAILOX Barcelona';
    image = IMG.premium;
    description = 'Descubre todas las promociones de NAILOX: 5% descuento al pagar con tarjeta, hasta 500 puntos gratis de bienvenida, programa de referidos, tarjetas regalo con doble bonus y mucho más.';
  }
  else if (path === '/sede-eixample') {
    title = 'Bienvenida a NAILOX · Eixample Barcelona';
    image = IMG.premium;
    description = 'WiFi gratis, reseña en Google y reservas en segundos. Todo desde tu móvil, durante tu cita en NAILOX Eixample.';
  }
  else if (path === '/mi-cuenta' || path === '/mis-citas') {
    title = 'Mi Cuenta · Gestiona tus citas y puntos NAILOX';
    image = IMG.pastel;
    description = 'Gestiona tu cuenta NAILOX: revisa tus citas, puntos acumulados, tarjetas regalo, código de referido y configuración de notificaciones.';
  }
  else if (path === '/privacidad') {
    title = 'Política de Privacidad';
    image = IMG.pastel;
    description = 'Política de privacidad de NAILOX. Conoce cómo tratamos tus datos personales, uso de cookies y tus derechos según el RGPD.';
  }
  else if (path === '/terminos') {
    title = 'Términos y Condiciones';
    image = IMG.pastel;
    description = 'Términos y condiciones de uso de los servicios de NAILOX Barcelona: reservas, cancelaciones, pagos, puntos y tarjetas regalo.';
  }
  else if (path === '/recuperar') {
    title = 'Recuperar Contraseña';
    image = IMG.pastel;
    description = 'Restablece tu contraseña de NAILOX. Te enviaremos un enlace seguro a tu correo electrónico.';
  }
  else if (path === '/nueva-contrasena') {
    title = 'Establecer Nueva Contraseña';
    image = IMG.pastel;
    description = 'Establece una nueva contraseña para tu cuenta NAILOX.';
  }
  else if (path === '/confirmar-email') {
    title = 'Confirma tu Email';
    image = IMG.pastel;
    description = 'Confirma tu dirección de correo electrónico para activar tu cuenta NAILOX y ganar 100 puntos de bienvenida.';
  }

  const canonical = `https://www.nailox.com${path}`;
  const fullTitle = `${title} — NAILOX`;

  // Pages we never want indexed (account/auth/transactional)
  const NOINDEX_PATHS = new Set<string>([
    '/login',
    '/registro',
    '/mi-cuenta',
    '/mis-citas',
    '/recuperar',
    '/nueva-contrasena',
    '/confirmar-email',
  ]);
  const robotsMeta = NOINDEX_PATHS.has(path)
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robotsMeta}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="NAILOX">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@nailox_academy">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${title}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><strong>NAILOX</strong> — Carrer del Rosselló 497, Eixample, Barcelona · +34 636 68 91 01</p>
  <p><a href="${canonical}">Visitar NAILOX</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
