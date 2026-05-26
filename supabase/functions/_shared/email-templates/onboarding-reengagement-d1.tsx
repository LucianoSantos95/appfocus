/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  displayName?: string
  siteUrl: string
  completedModules?: number
  totalModules?: number
  segmentLabel?: string
}

export const OnboardingReengagementD1Email = ({
  displayName,
  siteUrl,
  completedModules = 0,
  totalModules = 3,
  segmentLabel,
}: Props) => {
  const remaining = Math.max(totalModules - completedModules, 1)
  const progressPct = Math.round((completedModules / totalModules) * 100)
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Você está a {remaining} passo{remaining > 1 ? 's' : ''} do seu cupom de 20% OFF</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
          </Section>
          <Heading style={h1}>
            {displayName ? `${displayName}, sua operação está esperando` : 'Sua operação está esperando'}
          </Heading>
          <Text style={text}>
            Você começou a configurar seu Hub {segmentLabel ? `de ${segmentLabel}` : ''} mas parou no meio do caminho.
            Suas configurações estão salvas — é só continuar de onde parou.
          </Text>
          <Section style={progressWrap}>
            <Text style={progressLabel}>Progresso: {completedModules}/{totalModules} módulos</Text>
            <div style={{ ...progressBar }}>
              <div style={{ ...progressFill, width: `${progressPct}%` }} />
            </div>
          </Section>
          <Text style={highlight}>
            🎁 Ao concluir você ganha <strong>20% OFF</strong> em qualquer plano — o cupom é aplicado automaticamente.
          </Text>
          <Section style={buttonSection}>
            <Button style={buttonPrimary} href={`${siteUrl}/onboarding`}>
              Continuar de onde parei
            </Button>
          </Section>
          <Text style={footer}>Leva menos de 5 minutos. Sério.</Text>
          <Text style={footerBrand}>Focus Gestão Inteligente</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OnboardingReengagementD1Email

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#141b2d', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5a6178', lineHeight: '1.6', margin: '0 0 20px' }
const progressWrap = { margin: '0 0 24px' }
const progressLabel = { fontSize: '13px', color: '#5a6178', margin: '0 0 8px', fontWeight: '600' as const }
const progressBar = { width: '100%', height: '8px', backgroundColor: '#eef2f7', borderRadius: '999px', overflow: 'hidden' as const }
const progressFill = { height: '8px', backgroundColor: primary, borderRadius: '999px' }
const highlight = { fontSize: '14px', color: '#141b2d', backgroundColor: '#eaf3ff', padding: '14px 16px', borderRadius: '12px', margin: '0 0 24px', lineHeight: '1.5' }
const buttonSection = { margin: '8px 0 24px' }
const buttonPrimary = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
