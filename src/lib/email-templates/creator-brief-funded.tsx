import * as React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { Detail, DetailBox, NotificationEmail, bodyText, gbp } from './notification-layout'

interface Props {
  briefTitle?: string
  brandName?: string
  amount?: number
  creatorShare?: number
}

const CreatorBriefFunded = ({ briefTitle, brandName, amount, creatorShare }: Props) => (
  <NotificationEmail
    preview={`${brandName || 'A brand'} accepted your pitch and paid into escrow`}
    title="Your pitch was accepted"
    ctaLabel="Open your dashboard"
    ctaPath="/dashboard/creator"
  >
    <Text style={bodyText}>
      {brandName || 'The brand'} accepted your pitch for <strong>{briefTitle || 'their campaign'}</strong> and has paid into
      escrow. Create the content, then submit your proof from your dashboard to get paid.
    </Text>
    <DetailBox>
      <Detail label="Held in escrow" value={gbp(amount)} />
      <Detail label="Your share on release" value={gbp(creatorShare)} />
    </DetailBox>
  </NotificationEmail>
)

export const template = {
  component: CreatorBriefFunded,
  subject: (d: Record<string, any>) => `Pitch accepted: ${d.briefTitle || 'campaign brief'}`,
  displayName: 'Creator – brief funded',
  previewData: { briefTitle: 'Autumn coffee launch', brandName: 'Acme Coffee', amount: 200, creatorShare: 170 },
} satisfies TemplateEntry
