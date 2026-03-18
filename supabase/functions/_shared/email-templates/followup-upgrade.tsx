/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface FollowupUpgradeEmailProps {
  displayName?: string
  siteUrl: string
  plansUrl: string
}

export const FollowupUpgradeEmail = ({
  displayName,
  siteUrl,
  plansUrl,
}: FollowupUpgradeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Desbloqueie todo o potencial do Focus — conheça os planos</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>
          {displayName ? `${displayName}, pronto para crescer?` : 'Pronto para crescer?'}
        </Heading>
        <Text style={text}>
          Você está usando o plano gratuito do Focus. Com um plano pago, sua empresa desbloqueia:
        </Text>
        <Text style={featureList}>
          ✅ Criação ilimitada de registros em todos os módulos{'\n'}
          ✅ Exportação de relatórios em PDF e planilha{'\n'}
          ✅ Importação de dados via planilha{'\n'}
          ✅ Análise de clientes com Inteligência Artificial{'\n'}
          ✅ Suporte prioritário
        </Text>
        <Section style={buttonSection}>
          <Button style={buttonPrimary} href={plansUrl}>
            Ver Planos e Preços
          </Button>
        </Section>
        <Text style={secondaryCta}>
          Ou <a href={siteUrl} style={link}>continue usando o plano gratuito</a> — sem compromisso.
        </Text>
        <Text style={footer}>
          Este e-mail foi enviado porque você se cadastrou no Focus Gestão Inteligente.
        </Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default FollowupUpgradeEmail

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#141b2d',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#5a6178',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const featureList = {
  fontSize: '14px',
  color: '#5a6178',
  lineHeight: '2',
  margin: '0 0 24px',
  whiteSpace: 'pre-line' as const,
}
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
const secondaryCta = {
  fontSize: '14px',
  color: '#5a6178',
  margin: '0 0 32px',
  lineHeight: '1.5',
}
const link = { color: primary, textDecoration: 'underline' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
