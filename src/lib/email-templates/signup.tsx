import * as React from 'react'
import { main, text, button, darkModeCss, link } from './styles'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const outer = { padding: '32px 16px', maxWidth: '560px' }
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #ede4f7',
  borderRadius: '16px',
  padding: '32px 28px',
}
const band = { backgroundColor: '#faf8fc', borderRadius: '20px', padding: '24px 16px' }
const wordmark = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1b102c',
  margin: '0 0 24px',
}
const heading = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#1b102c',
  margin: '0 0 16px',
}
const footerLinks = { fontSize: '12px', color: '#77717f', textAlign: 'center' as const, margin: '24px 0 0' }
const footLink = { color: '#8035d8', textDecoration: 'none' }

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Welcome to {siteName} — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={band}>
          <Text style={wordmark}>
            Creator Connect<span style={{ color: '#8035d8' }}>.</span>
          </Text>
          <Section style={card}>
            <Heading style={heading}>Welcome to {siteName}</Heading>
            <Text style={text}>
              Connect directly with niche creators and sponsors for fast, transparent partnerships.
            </Text>
            <Text style={text}>
              Please confirm your email address (
              <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>) to activate your account.
            </Text>
            <Button className="dm-btn" style={{ ...button, backgroundColor: '#8035d8', border: '1px solid #8035d8', fontWeight: 'bold' as const }} href={confirmationUrl}>
              Verify email &amp; get started
            </Button>
            <Text style={{ fontSize: '12px', color: '#77717f', margin: '24px 0 0' }}>
              If you didn't create an account, you can safely ignore this email.
            </Text>
          </Section>
          <Text style={footerLinks}>
            <Link href={`${siteUrl}/explore`} style={footLink}>Explore creators</Link>
            {'  ·  '}
            <Link href={`${siteUrl}/how-it-works`} style={footLink}>How it works</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
