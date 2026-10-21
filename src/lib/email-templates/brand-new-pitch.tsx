import * as React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { DetailBox, NotificationEmail, bodyText } from './notification-layout'

interface Props {
  briefTitle?: string
  creatorName?: string
  pitchExcerpt?: string
}

const quote = { fontSize: '14px', color: '#1b102c', lineHeight: '1.5', margin: '0', fontStyle: 'italic' as const }

const BrandNewPitch = ({ briefTitle, creatorName, pitchExcerpt }: Props) => (
  <NotificationEmail
    preview={`${creatorName || 'A creator'} pitched for ${briefTitle || 'your brief'}`}
    title="You have a new pitch"
    ctaLabel="Review pitches"
    ctaPath="/dashboard/sponsor#pitches"
  >
    <Text style={bodyText}>
      {creatorName || 'A creator'} has pitched for <strong>{briefTitle || 'your campaign brief'}</strong>.
    </Text>
    {pitchExcerpt && (
      <DetailBox>
        <Text style={quote}>“{pitchExcerpt}”</Text>
      </DetailBox>
    )}
  </NotificationEmail>
)

export const template = {
  component: BrandNewPitch,
  subject: (d: Record<string, any>) => `New pitch for ${d.briefTitle || 'your brief'}`,
  displayName: 'Brand – new pitch',
  previewData: { briefTitle: 'Autumn coffee launch', creatorName: 'Sam Rivers', pitchExcerpt: 'My audience of 8k home baristas would love this…' },
} satisfies TemplateEntry
