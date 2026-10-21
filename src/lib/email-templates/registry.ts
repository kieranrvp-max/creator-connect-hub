import type { ComponentType } from 'react'
import { template as creatorBookingPaid } from './creator-booking-paid'
import { template as creatorBriefFunded } from './creator-brief-funded'
import { template as brandNewPitch } from './brand-new-pitch'
import { template as brandWorkDelivered } from './brand-work-delivered'
import { template as referrerCommission } from './referrer-commission'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/** Template registry — maps template names to their React Email components. */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'creator-booking-paid': creatorBookingPaid,
  'creator-brief-funded': creatorBriefFunded,
  'brand-new-pitch': brandNewPitch,
  'brand-work-delivered': brandWorkDelivered,
  'referrer-commission': referrerCommission,
}
