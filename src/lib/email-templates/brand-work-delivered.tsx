import * as React from 'react'
import { Link, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { DetailBox, NotificationEmail, bodyText } from './notification-layout'
import { link } from './styles'

interface Props {
  title?: string
  creatorName?: string
  proofUrl?: string
  isBrief?: boolean
}

const BrandWorkDelivered = ({ title, creatorName, proofUrl, isBrief }: Props) => (
  <NotificationEmail
    preview={`${creatorName || 'Your creator'} has delivered ${title || 'your sponsorship'}`}
    title="Your content is live"
    ctaLabel={isBrief ? 'Review and release payment' : 'View your order'}
    ctaPath={isBrief ? '/dashboard/sponsor#pitches' : '/dashboard/sponsor'}
  >
    <Text style={bodyText}>
      {creatorName || 'Your creator'} has published the content for <strong>{title || 'your sponsorship'}</strong>.
      {isBrief ? ' Check it over, then release the escrow payment from your dashboard.' : ''}
    </Text>
    {proofUrl && (
      <DetailBox>
        <Text style={{ ...bodyText, margin: '0' }}>
          <Link href={proofUrl} style={link}>View the delivered work</Link>
        </Text>
      </DetailBox>
    )}
  </NotificationEmail>
)

export const template = {
  component: BrandWorkDelivered,
  subject: (d: Record<string, any>) => `Delivered: ${d["title"] || 'your sponsorship'}`,
  displayName: 'Brand – work delivered',
  previewData: { title: 'Autumn coffee launch', creatorName: 'Sam Rivers', proofUrl: 'https://instagram.com/p/example', isBrief: true },
} satisfies TemplateEntry
