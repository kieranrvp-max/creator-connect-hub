import * as React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { Detail, DetailBox, NotificationEmail, bodyText, gbp } from './notification-layout'

interface Props {
  code?: string
  bookingAmount?: number
  ratePercent?: string
  earned?: number
}

const ReferrerCommission = ({ code, bookingAmount, ratePercent, earned }: Props) => (
  <NotificationEmail
    preview={`Your code ${code || ''} was just used — you earned ${gbp(earned)}`}
    title={`You earned ${gbp(earned)}`}
    ctaLabel="See your referral balance"
    ctaPath="/account"
  >
    <Text style={bodyText}>
      Your code <strong>{code || ''}</strong> was just used on a paid booking. Your commission has been added to your referral balance.
    </Text>
    <DetailBox>
      <Detail label="Booking amount" value={gbp(bookingAmount)} />
      <Detail label="Your commission" value={`${ratePercent || ''}% = ${gbp(earned)}`} />
    </DetailBox>
  </NotificationEmail>
)

export const template = {
  component: ReferrerCommission,
  subject: (d: Record<string, any>) => `Your code ${d.code || ''} earned you ${gbp(d.earned)}`,
  displayName: 'Referrer – code used',
  previewData: { code: 'SAMSPICK', bookingAmount: 100, ratePercent: '2.5', earned: 2.5 },
} satisfies TemplateEntry
