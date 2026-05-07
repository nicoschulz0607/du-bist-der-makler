import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
export const FROM_EMAIL = 'Besichtigungen <termine@du-bist-der-makler.de>'
export const FROM_SUPPORT = 'du bist der makler <support@du-bist-der-makler.de>'
