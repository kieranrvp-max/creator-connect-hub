import * as React from 'react'
import type { ReactNode } from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from '@react-email/components'
import { main, text, button } from './styles'

export const SITE_URL = 'https://creatorconnecthub.co.uk'

const outer = { padding: '32px 16px', maxWidth: '560px' }
const band = { backgroundColor: '#faf8fc', borderRadius: '20px', padding: '24px 16px' }
const card = { backgroundColor: '#ffffff', border: '1px solid #ede4f7', borderRadius: '16px', padding: '32px 28px' }
const wordmark = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '24px', fontWeight: 'bold' as const, color: '#1b102c', margin: '0 0 24px' }
const heading = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '24px', fontWeight: 'bold' as const, color: '#1b102c', margin: '0 0 16px' }
const footerLinks = { fontSize: '12px', color: '#77717f', textAlign: 'center' as const, margin: '24px 0 0' }
const footLink = { color: '#8035d8', textDecoration: 'none' }
const rowLabel = { fontSize: '13px', color: '#77717f', margin: '0' }
const rowValue = { fontSize: '15px', color: '#1b102c', fontWeight: 'bold' as const, margin: '0 0 12px' }
const box = { backgroundColor: '#faf8fc', borderRadius: '12px', padding: '16px 18px', margin: '0 0 24px' }

export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value}</Text>
    </>
  )
}

export function DetailBox({ children }: { children: ReactNode }) {
  return <Section style={box}>{children}</Section>
}

export function NotificationEmail({
  preview,
  title,
  ctaLabel,
  ctaPath,
  children,
}: {
  preview: string
  title: string
  ctaLabel: string
  ctaPath: string
  children: ReactNode
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Section style={band}>
            <Text style={wordmark}>
              Creator Connect<span style={{ color: '#8035d8' }}>.</span>
            </Text>
            <Section style={card}>
              <Heading style={heading}>{title}</Heading>
              {children}
              <Button
                style={{ ...button, backgroundColor: '#8035d8', border: '1px solid #8035d8', fontWeight: 'bold' as const }}
                href={`${SITE_URL}${ctaPath}`}
              >
                {ctaLabel}
              </Button>
            </Section>
            <Text style={footerLinks}>
              <Link href={`${SITE_URL}/explore`} style={footLink}>Explore</Link>
              {'  ·  '}
              <Link href={`${SITE_URL}/contact`} style={footLink}>Support</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const bodyText = text

export const gbp = (n: unknown) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(n) || 0)
