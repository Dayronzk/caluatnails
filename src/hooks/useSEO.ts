import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  keywords?: string;
  noindex?: boolean;
}

const SITE_NAME = "NAILOX";
const BASE_URL = "https://www.nailox.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/manicure-premium.png`;
const DEFAULT_TITLE = "NAILOX — Manicura y Pedicura Profesional en Barcelona (Eixample)";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [attrName, attrValue] = selector
      .replace("meta[", "")
      .replace("]", "")
      .replace(/"/g, "")
      .split("=");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = "website",
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  keywords,
  noindex,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const resolvedOgTitle = ogTitle ?? title;
    const resolvedOgDesc = ogDescription ?? description;
    const resolvedOgImage = ogImage ?? DEFAULT_OG_IMAGE;
    const resolvedUrl = ogUrl ? `${BASE_URL}${ogUrl}` : BASE_URL;

    document.title = fullTitle;

    setMeta('meta[name="description"]', "content", description);
    if (keywords) setMeta('meta[name="keywords"]', "content", keywords);

    setMeta(
      'meta[name="robots"]',
      "content",
      noindex ? "noindex, nofollow" : DEFAULT_ROBOTS,
    );

    if (canonical) setLink("canonical", `${BASE_URL}${canonical}`);

    setMeta('meta[property="og:title"]', "content", resolvedOgTitle);
    setMeta('meta[property="og:description"]', "content", resolvedOgDesc);
    setMeta('meta[property="og:image"]', "content", resolvedOgImage);
    setMeta('meta[property="og:url"]', "content", resolvedUrl);
    setMeta('meta[property="og:type"]', "content", ogType);
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);

    setMeta('meta[name="twitter:title"]', "content", twitterTitle ?? resolvedOgTitle);
    setMeta('meta[name="twitter:description"]', "content", twitterDescription ?? resolvedOgDesc);
    setMeta('meta[name="twitter:image"]', "content", twitterImage ?? resolvedOgImage);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="robots"]', "content", DEFAULT_ROBOTS);
    };
  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, ogType, twitterTitle, twitterDescription, twitterImage, canonical, keywords, noindex]);
}
