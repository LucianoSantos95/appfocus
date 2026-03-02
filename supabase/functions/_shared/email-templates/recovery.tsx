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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinição de senha — Focus Gestão Inteligente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>Redefinir sua senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no Focus Gestão Inteligente. Clique no botão abaixo para criar uma nova senha.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Redefinir Senha
          </Button>
        </Section>
        <Text style={footer}>
          Se você não solicitou esta redefinição, ignore este e-mail. Sua senha não será alterada.
        </Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
