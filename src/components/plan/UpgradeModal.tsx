// O Hub é 100% gratuito — não existe upgrade a ser oferecido.
// Mantido como no-op: as páginas ainda montam o componente, mas ele nunca aparece
// (os estados que o abriam deixaram de ser acionados).
interface UpgradeModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentCount?: number;
  maxCount?: number;
  moduleName?: string;
}

export function UpgradeModal(_props: UpgradeModalProps) {
  return null;
}
