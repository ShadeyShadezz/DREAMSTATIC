'use client'

import { ReactNode } from 'react'
import Chatbox from './Chatbox'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Chatbox />
    </>
  )
}
