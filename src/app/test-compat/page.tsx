'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function CompatTest() {
  const [status, setStatus] = useState('testing...')
  
  useEffect(() => {
    async function test() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: trades } = await supabase.from('trades').select('id').limit(1)
      const { data: journals } = await supabase.from('journal_entries').select('id').limit(1)
      setStatus(`Auth: ${user ? 'OK' : 'Not logged in'} | Trades: ${trades ? 'OK' : 'FAIL'} | Journals: ${journals ? 'OK' : 'FAIL'}`)
    }
    test()
  }, [])
  
  return <div className="p-8">{status}</div>
}
