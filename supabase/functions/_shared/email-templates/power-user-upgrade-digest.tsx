/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  displayName?: string
  siteUrl: string
  plansUrl: string
  clientesCount?: number
  projetosCount?: number
  tarefasCount?: number
  transacoesCount?: number
}

export const PowerUserUpgradeDigestEmail = ({
  displayName,
  siteUrl,
  plansUrl,
  clientesCount = 0,
  projetosCount = 0,
  tarefasCount = 0,
  transacoesCount = 0,
}: Props) => {
  const total = clientesCount + projetosCount + tarefasCount + transacoesCount
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Sua operação está crescendo — hora de remover os limites</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} width="140" height="40" alt="Focus Gestão Inteligente" style={logo} />
          </Section>
          <Heading style={h1}>
            {displayName ? `${displayName}, sua operação está bombando 🚀` : 'Sua operação está bombando 🚀'}
          </Heading>
          <Text style={text}>
            Nas últimas duas semanas você usou o Hub <strong>de verdade</strong>. Olha só o que você criou:
          </Text>
          <Section style={statsBox}>
            <Text style={statRow}>👥 <strong>{clientesCount}</strong> clientes cadastrados</Text>
            <Text style={statRow}>📁 <strong>{projetosCount}</strong> projetos em andamento</Text>
            <Text style={statRow}>✅ <strong>{tarefasCount}</strong> tarefas registradas</Text>
            <Text style={statRow}>💰 <strong>{transacoesCount}</strong> transações financeiras</Text>
          </Section>
          <Text style={text}>
            São <strong>{total} registros</strong> em 14 dias. Você está perto do limite do plano gratuito (20 itens por módulo).
            Antes de bater no teto, considere remover os limites:
          </Text>
          <Section style={featuresBox}>
            <Text style={feature}>✅ Registros <strong>ilimitados</strong> em todos os módulos</Text>
            <Text style={feature}>✅ Exportação de relatórios em PDF e Excel</Text>
            <Text style={feature}>✅ Importação via planilha</Text>
            <Text style={feature}>✅ Análise de clientes com IA</Text>
            <Text style={feature}>✅ Suporte prioritário</Text>
          </Section>
          <Section style={buttonSection}>
            <Button style={buttonPrimary} href={plansUrl}>
              Ver planos e preços
            </Button>
          </Section>
          <Text style={secondaryCta}>
            Sem pressa? <a href={siteUrl} style={link}>Continue no plano gratuito</a> — você decide quando crescer.
          </Text>
          <Text style={footerBrand}>Focus Gestão Inteligente</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default PowerUserUpgradeDigestEmail

const logoUrl = 'https://hnextembswhejumvxbzd.supabase.co/storage/v1/object/public/email-assets/logo.png'
const primary = '#4da3ff'
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '32px' }
const logo = { display: 'block' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#141b2d', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#5a6178', lineHeight: '1.6', margin: '0 0 20px' }
const statsBox = { backgroundColor: '#f7f9fc', padding: '18px 20px', borderRadius: '12px', margin: '0 0 22px' }
const statRow = { fontSize: '14px', color: '#141b2d', margin: '0 0 8px', lineHeight: '1.4' }
const featuresBox = { margin: '0 0 24px' }
const feature = { fontSize: '14px', color: '#5a6178', margin: '0 0 8px', lineHeight: '1.5' }
const buttonSection = { margin: '8px 0 16px' }
const buttonPrimary = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const secondaryCta = { fontSize: '13px', color: '#5a6178', margin: '0 0 24px', lineHeight: '1.5' }
const link = { color: primary, textDecoration: 'underline' }
const footerBrand = { fontSize: '12px', color: '#c5cad3', margin: '16px 0 0' }
