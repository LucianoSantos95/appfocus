/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  displayName?: string
  siteUrl: string
  segmentLabel?: string
  segment?: string
}

const FIRST_ACTION: Record<string, string> = {
  agencia: 'Lance seu primeiro cliente — só nome e contato. Leva 30 segundos.',
  consultoria: 'Cadastre um projeto ativo — cliente, valor e prazo. Pronto.',
  freelancer: 'Registre um recebimento — qualquer valor, de qualquer cliente.',
  pme: 'Adicione um cliente ou uma transação. Só isso já conta.',
}

export const OnboardingReengagementExploringEmail = ({
  displayName,
  siteUrl,
  segmentLabel,
  segment,
}: Props) => {
  const action = (segment && FIRST_ACTION[segment]) ?? 'Lance o primeiro dado — cliente, projeto, ou transação.'
  const name = displayName ?? 'você'

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Você já disse que quer usar com seus dados reais — falta só o primeiro passo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
          </Section>
          <Heading style={h1}>
            {`${displayName ? displayName + ', você' : 'Você'} está mais perto do que imagina`}
          </Heading>
          <Text style={text}>
            Você já superou a maioria — configurou o Hub
            {segmentLabel ? ` de ${segmentLabel}` : ''} e decidiu começar com seus dados reais.
          </Text>
          <Text style={text}>
            O primeiro passo leva menos de 2 minutos:
          </Text>
          <Section style={actionBox}>
            <Text style={actionText}>
              👉 {action}
            </Text>
          </Section>
          <Text style={text}>
            Sem tutorial, sem dados de demonstração. Só {name} e o seu negócio.
          </Text>
          <Section style={buttonSection}>
            <Button style={buttonPrimary} href={siteUrl}>
              Entrar e começar agora
            </Button>
          </Section>
          <Text style={footer}>
            Dúvidas? Responda este e-mail — respondemos em até 1 dia útil.
          </Text>
          <Text style={footerBrand}>Focus Gestão Inteligente</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OnboardingReengagementExploringEmail

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#141b2d', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5a6178', lineHeight: '1.6', margin: '0 0 20px' }
const actionBox = {
  backgroundColor: '#f0f7ff',
  border: '1px solid #c3dffe',
  padding: '16px 20px',
  borderRadius: '12px',
  margin: '0 0 24px',
}
const actionText = { fontSize: '15px', color: '#141b2d', margin: 0, lineHeight: '1.5' }
const buttonSection = { margin: '8px 0 24px' }
const buttonPrimary = {
  backgroundColor: primary,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
