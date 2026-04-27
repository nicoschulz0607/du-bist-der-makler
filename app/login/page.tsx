import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Einloggen — du bist der makler',
  description: 'Melde dich an und verwalte deinen Immobilienverkauf.',
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
