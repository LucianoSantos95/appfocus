/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  displayName?: string
  siteUrl: string
  segmentLabel?: string
}

export const OnboardingReengagementD3Email = ({ displayName, siteUrl, segmentLabel }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Centenas de operações já estão rodando — seu cupom expira em 5 dias</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>
          {displayName ? `${displayName}, não fique de fora` : 'Não fique de fora'}
        </Heading>
        <Text style={text}>
          Enquanto você adia a configuração, centenas de {segmentLabel || 'operações'} já estão usando o Hub
          para organizar clientes, projetos e finanças em um só lugar.
        </Text>
        <Section style={socialProofBox}>
            <Text style={socialProofText}>
              ⭐ <strong>“Em uma semana parei de perder follow-up.”</strong><br />
              — Ana, agência de marketing
            </Text>
        </Section>
        <Text style={urgency}>
          ⏰ Seu cupom de <strong>20% OFF</strong> em qualquer plano expira em <strong>5 dias</strong>.
          Depois disso ele some — e não voltamos a oferecer.
        </Text>
        <Section style={buttonSection}>
          <Button style={buttonPrimary} href={`${siteUrl}/onboarding`}>
            Finalizar configuração agora
          </Button>
        </Section>
        <Text style={footer}>Você está a 5 minutos de desbloquear o desconto.</Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default OnboardingReengagementD3Email

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#141b2d', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5a6178', lineHeight: '1.6', margin: '0 0 20px' }
const socialProofBox = { backgroundColor: '#f7f9fc', borderLeft: `3px solid ${primary}`, padding: '14px 18px', borderRadius: '8px', margin: '0 0 22px' }
const socialProofText = { fontSize: '14px', color: '#141b2d', lineHeight: '1.5', margin: 0 }
const urgency = { fontSize: '14px', color: '#7a3a00', backgroundColor: '#fff4e0', padding: '14px 16px', borderRadius: '12px', margin: '0 0 24px', lineHeight: '1.5' }
const buttonSection = { margin: '8px 0 24px' }
const buttonPrimary = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
