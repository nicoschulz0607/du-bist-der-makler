import { Suspense } from 'react'
import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Registrieren — du bist der makler',
  description: 'Erstelle dein kostenloses Konto und starte deinen Immobilienverkauf.',
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  )
}
