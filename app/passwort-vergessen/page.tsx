import type { Metadata } from 'next'
import { Suspense } from 'react'
import AuthLayout from '@/components/auth/AuthLayout'
import PasswortVergessenForm from '@/components/auth/PasswortVergessenForm'

export const metadata: Metadata = {
  title: 'Passwort zurücksetzen — du bist der makler',
}

export default function PasswortVergessenPage() {
  return (
    <AuthLayout>
      <Suspense>
        <PasswortVergessenForm />
      </Suspense>
    </AuthLayout>
  )
}
