/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  displayName?: string
  siteUrl: string
}

export const OnboardingReengagementD7Email = ({ displayName, siteUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Última chance: seu cupom de 20% OFF expira em 48h</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
        </Section>
        <Heading style={h1}>
          {displayName ? `${displayName}, esta é a última mensagem` : 'Esta é a última mensagem'}
        </Heading>
        <Text style={text}>
          Não vamos mais te perturbar. Mas antes de ir, precisava te avisar:
        </Text>
        <Section style={lossBox}>
          <Text style={lossText}>
            ❌ Seu cupom de <strong>20% OFF</strong> em qualquer plano será <strong>cancelado em 48 horas</strong>.
          </Text>
          <Text style={lossSub}>
            Depois disso, o desconto não voltará — nem para você, nem para sua empresa.
          </Text>
        </Section>
        <Text style={text}>
          Se quiser usar o cupom, basta concluir a configuração rápida (5 minutos) e ele é aplicado automaticamente em qualquer plano pago.
        </Text>
        <Section style={buttonSection}>
          <Button style={buttonPrimary} href={`${siteUrl}/onboarding`}>
            Resgatar meu cupom
          </Button>
        </Section>
        <Text style={footer}>Se não for agora, sem ressentimentos. Você pode continuar usando o plano gratuito normalmente.</Text>
        <Text style={footerBrand}>Focus Gestão Inteligente</Text>
      </Container>
    </Body>
  </Html>
)

export default OnboardingReengagementD7Email

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#141b2d', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5a6178', lineHeight: '1.6', margin: '0 0 20px' }
const lossBox = { backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', padding: '16px 18px', borderRadius: '12px', margin: '0 0 24px' }
const lossText = { fontSize: '15px', color: '#a51919', margin: '0 0 8px', lineHeight: '1.5' }
const lossSub = { fontSize: '13px', color: '#a51919', margin: 0, lineHeight: '1.5' }
const buttonSection = { margin: '8px 0 24px' }
const buttonPrimary = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
