'use client'

import { AdminSidebar }   from '@/components/admin/AdminSidebar'
import { AdminHeader }    from '@/components/admin/AdminHeader'
import { ToastContainer } from '@/components/shared/Toast'
import { AdminLogin, useAdminAuth } from '@/components/admin/AdminLogin'
import { useEffect }      from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authed, setAuthed } = useAdminAuth()

  useEffect(() => {
    document.body.classList.add('admin-body')
    return () => document.body.classList.remove('admin-body')
  }, [])

  if (authed === null) return null

  if (!authed) {
    return <AdminLogin onAuth={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-[#F4F2EF] font-body">
      <ToastContainer />
      <AdminSidebar />
      <AdminHeader />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
