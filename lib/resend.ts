import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Besichtigungen <onboarding@resend.dev>'
export const FROM_SUPPORT = process.env.RESEND_FROM ?? 'du bist der makler <onboarding@resend.dev>'
export const REPLY_TO_SUPPORT = process.env.RESEND_REPLY_TO ?? 'onboarding@resend.dev'
