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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de e-mail — Focus Gestão Inteligente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>Confirmar alteração de e-mail</Heading>
        <Text style={text}>
          Você solicitou a alteração do e-mail da sua conta no Focus Gestão Inteligente de{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clique no botão abaixo para confirmar:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirmar Alteração
          </Button>
        </Section>
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente.
        </Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png?v=2'
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
const link = { color: primary, textDecoration: 'none' }
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
