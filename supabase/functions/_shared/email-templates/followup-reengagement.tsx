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

interface FollowupReengagementEmailProps {
  displayName?: string
  siteUrl: string
}

export const FollowupReengagementEmail = ({
  displayName,
  siteUrl,
}: FollowupReengagementEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você já explorou todos os módulos do Focus?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>
          {displayName ? `${displayName}, sentimos sua falta!` : 'Sentimos sua falta!'}
        </Heading>
        <Text style={text}>
          Você criou sua conta há alguns dias mas ainda não explorou tudo o que o Focus pode fazer pela sua empresa. Aqui vão algumas dicas rápidas:
        </Text>
        <Text style={tipStyle}>
          💡 <strong>Importe seus dados</strong> — traga sua planilha de clientes ou finanças em poucos cliques
        </Text>
        <Text style={tipStyle}>
          🤖 <strong>Use a Análise com IA</strong> — descubra insights sobre seus clientes automaticamente
        </Text>
        <Text style={tipStyle}>
          📊 <strong>Veja o Dashboard</strong> — tenha uma visão geral do seu negócio em tempo real
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={siteUrl}>
            Voltar ao Focus
          </Button>
        </Section>
        <Text style={footer}>
          Dúvidas? Responda este e-mail — estamos aqui para ajudar.
        </Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default FollowupReengagementEmail

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/focus-logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px', backgroundColor: '#141b2d', borderRadius: '12px', padding: '16px 20px' }
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
const tipStyle = {
  fontSize: '14px',
  color: '#5a6178',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const buttonSection = { margin: '16px 0 32px' }
const button = {
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
