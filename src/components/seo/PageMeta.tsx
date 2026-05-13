import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  /** Route path (e.g. "/clientes"). Used for canonical and og:url. */
  path?: string;
}

const SITE_URL = "https://app.focusinteligente.com.br";

export function PageMeta({ title, description, path = "/" }: PageMetaProps) {
  const fullTitle = `${title} | Hub Empresarial`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
