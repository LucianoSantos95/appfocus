// O Hub é 100% gratuito — não existe teto de registros, então não há o que avisar.
// Mantido como no-op para não precisar editar as 7 páginas que o renderizam.
interface FreemiumWarningBannerProps {
  currentCount?: number;
  maxCount?: number;
  moduleName?: string;
}

export function FreemiumWarningBanner(_props: FreemiumWarningBannerProps) {
  return null;
}
