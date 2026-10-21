import * as React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { Detail, DetailBox, NotificationEmail, bodyText, gbp } from './notification-layout'

interface Props {
  listingTitle?: string
  brandName?: string
  amount?: number
  creatorShare?: number
  launchDate?: string
}

const CreatorBookingPaid = ({ listingTitle, brandName, amount, creatorShare, launchDate }: Props) => (
  <NotificationEmail
    preview={`${brandName || 'A brand'} has paid to book ${listingTitle || 'your listing'}`}
    title="You have a new paid booking"
    ctaLabel="Review the request"
    ctaPath="/dashboard/creator"
  >
    <Text style={bodyText}>
      {brandName || 'A brand'} has paid to sponsor <strong>{listingTitle || 'your listing'}</strong>. The money is held safely
      until you accept. Please accept or decline within 48 hours, or the brand is refunded automatically.
    </Text>
    <DetailBox>
      {launchDate && <Detail label="Launch date" value={launchDate} />}
      <Detail label="Brand paid" value={gbp(amount)} />
      <Detail label="Your share" value={gbp(creatorShare)} />
    </DetailBox>
  </NotificationEmail>
)

export const template = {
  component: CreatorBookingPaid,
  subject: (d: Record<string, any>) => `New paid booking: ${d.listingTitle || 'your listing'}`,
  displayName: 'Creator – new paid booking',
  previewData: { listingTitle: 'Weekly Tech Newsletter', brandName: 'Acme Coffee', amount: 100, creatorShare: 85, launchDate: '3 Nov 2026' },
} satisfies TemplateEntry
