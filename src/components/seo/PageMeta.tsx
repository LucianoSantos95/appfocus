import { useEffect } from "react";

// react-helmet-async@3 é inerte neste setup (não injeta nada no <head>), o que
// deixava título, description, canonical e Open Graph mortos em TODAS as páginas.
// Aqui a manipulação é direta no document.head. Não voltar para o Helmet.

interface PageMetaProps {
  title: string;
  description: string;
  /** Route path (e.g. "/clientes"). Used for canonical and og:url. */
  path?: string;
  /** Override the default og:image (1200×630). */
  image?: string;
  /** Sufixo do título. O catálogo usa "Hub Central". */
  suffix?: string;
}

const SITE_URL = "https://app.focusinteligente.com.br";
const SITE_NAME = "Focus Gestão Inteligente";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function setTag(seletor: string, criar: () => HTMLElement, atributo: string, valor: string) {
  let el = document.head.querySelector(seletor) as HTMLElement | null;
  if (!el) {
    el = criar();
    document.head.appendChild(el);
  }
  el.setAttribute(atributo, valor);
}

function setMetaName(name: string, content: string) {
  setTag(`meta[name="${name}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  }, "content", content);
}

function setMetaProp(property: string, content: string) {
  setTag(`meta[property="${property}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  }, "content", content);
}

export function PageMeta({ title, description, path = "/", image, suffix = "Hub Empresarial" }: PageMetaProps) {
  const fullTitle = `${title} | ${suffix}`;
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    setMetaName("description", description);
    setMetaName("robots", "index, follow, max-image-preview:large, max-snippet:-1");

    setTag('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    }, "href", url);

    setMetaProp("og:type", "website");
    setMetaProp("og:site_name", SITE_NAME);
    setMetaProp("og:locale", "pt_BR");
    setMetaProp("og:title", fullTitle);
    setMetaProp("og:description", description);
    setMetaProp("og:url", url);
    setMetaProp("og:image", ogImage);
    setMetaProp("og:image:width", "1200");
    setMetaProp("og:image:height", "630");

    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", fullTitle);
    setMetaName("twitter:description", description);
    setMetaName("twitter:image", ogImage);
  }, [fullTitle, description, url, ogImage]);

  return null;
}
