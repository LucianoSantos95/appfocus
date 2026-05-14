import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { PageMeta } from "@/components/seo/PageMeta";

const Onboarding = () => (
  <>
    <PageMeta
      path="/onboarding"
      title="Onboarding guiado por IA"
      description="Configure sua operação no Hub Empresarial em minutos com onboarding guiado por IA: nicho, templates e primeiros dados aplicados automaticamente."
    />
    <main>
      <OnboardingFlow />
    </main>
  </>
);

export default Onboarding;
