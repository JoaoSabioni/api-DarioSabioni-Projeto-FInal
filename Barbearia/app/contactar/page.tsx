'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ContactarRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/marcar')
  }, [router])

  return null
}