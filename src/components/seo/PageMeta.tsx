import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  /** Route path (e.g. "/clientes"). Used for canonical and og:url. */
  path?: string;
  /** Override the default og:image (1200×630). */
  image?: string;
}

const SITE_URL = "https://app.focusinteligente.com.br";
const SITE_NAME = "Focus Gestão Inteligente";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export function PageMeta({ title, description, path = "/", image }: PageMetaProps) {
  const fullTitle = `${title} | Hub Empresarial`;
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
