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

interface FollowupWelcomeEmailProps {
  displayName?: string
  siteUrl: string
}

export const FollowupWelcomeEmail = ({
  displayName,
  siteUrl,
}: FollowupWelcomeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo ao Focus Gestão Inteligente — veja como começar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>
          {displayName ? `Olá, ${displayName}! 👋` : 'Bem-vindo ao Focus! 👋'}
        </Heading>
        <Text style={text}>
          Sua conta foi criada com sucesso. O Focus Gestão Inteligente reúne tudo o que você precisa para gerenciar sua empresa em um só lugar:
        </Text>
        <Text style={featureList}>
          📊 <strong>Finanças</strong> — controle receitas e despesas{'\n'}
          👥 <strong>Clientes</strong> — gerencie sua carteira com IA{'\n'}
          📋 <strong>Tarefas</strong> — organize suas atividades{'\n'}
          📈 <strong>Projetos</strong> — acompanhe entregas e prazos
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={siteUrl}>
            Explorar o Focus
          </Button>
        </Section>
        <Text style={footer}>
          Precisando de ajuda? Responda este e-mail ou acesse nosso guia dentro da plataforma.
        </Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default FollowupWelcomeEmail

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
const featureList = {
  fontSize: '14px',
  color: '#5a6178',
  lineHeight: '2',
  margin: '0 0 24px',
  whiteSpace: 'pre-line' as const,
}
const buttonSection = { margin: '8px 0 32px' }
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
