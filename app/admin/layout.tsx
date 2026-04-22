'use client'

import { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { AdminSidebar }      from '@/components/admin/AdminSidebar'
import { AdminHeader }       from '@/components/admin/AdminHeader'
import { ToastContainer }    from '@/components/shared/Toast'
import { AdminLogin, useAdminAuth } from '@/components/admin/AdminLogin'
import { PageTransition }    from '@/components/shared/PageTransition'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authed, setAuthed } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add('admin-body')
    return () => document.body.classList.remove('admin-body')
  }, [])

  if (authed === null) return null

  if (!authed) {
    return (
      <div className={poppins.variable}>
        <AdminLogin onAuth={() => setAuthed(true)} />
      </div>
    )
  }

  return (
    <div className={`${poppins.variable} min-h-screen bg-[#F7F5F2] font-[family-name:var(--font-poppins)]`}>
      <ToastContainer />
      <AdminSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <AdminHeader onMenuOpen={() => setSidebarOpen(true)} />
      <main className="lg:ml-60 pt-14 min-h-screen">
        <PageTransition>
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
