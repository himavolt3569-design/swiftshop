'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/storefront/Header'
import { Footer } from '@/components/storefront/Footer'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { User, Key, ShoppingBag, Star, Loader2 } from 'lucide-react'

export default function AccountPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || '')
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center mt-20 px-4 text-center">
          <User className="w-16 h-16 text-primary mb-4 opacity-50" />
          <h1 className="text-2xl font-display font-semibold text-on-surface mb-2">Not Logged In</h1>
          <p className="text-on-surface-variant">Please log in from the header to view your account.</p>
        </main>
        <Footer />
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Profile updated successfully!')
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!)
    
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset link sent to your email.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-24 pb-20 px-4 max-w-6xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-semibold text-on-surface mb-2">My Account</h1>
          <p className="text-on-surface-variant font-label">Manage your profile, orders, and reviews.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-2">
            {[
              { id: 'profile', label: 'Profile Settings', icon: User },
              { id: 'orders', label: 'My Orders', icon: ShoppingBag },
              { id: 'reviews', label: 'My Reviews', icon: Star },
              { id: 'security', label: 'Security', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-label font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-white shadow-glow-sm' 
                      : 'text-on-surface-variant hover:bg-surface-container/80 hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 glass rounded-3xl p-6 md:p-10 shadow-depth">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-display font-semibold mb-6">Profile Settings</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-label text-on-surface-variant mb-2">Email</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled 
                      className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-outline-variant/30 text-on-surface-variant opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-label text-on-surface-variant mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-gradient text-white font-label px-6 py-3 rounded-xl flex items-center justify-center w-full transition-transform active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                  </button>
                  {message && <p className="text-sm mt-3 text-center text-primary font-medium">{message}</p>}
                </form>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-display font-semibold mb-6">Security & Password</h2>
                <div className="max-w-md">
                  <p className="text-on-surface-variant text-sm mb-6">
                    Need to change your password? We will send a secure reset link to your registered email address.
                  </p>
                  <button 
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full px-6 py-3 rounded-xl border border-primary/50 text-primary hover:bg-primary/5 font-label transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Key className="w-4 h-4" /> Send Reset Link</>}
                  </button>
                  {message && <p className="text-sm mt-3 text-center text-primary font-medium">{message}</p>}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-display font-semibold mb-6">My Orders</h2>
                <div className="bg-surface-container/30 rounded-2xl p-12 text-center border border-outline-variant/20">
                  <ShoppingBag className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant font-medium">You haven't placed any orders yet.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-display font-semibold mb-6">My Reviews</h2>
                <div className="bg-surface-container/30 rounded-2xl p-12 text-center border border-outline-variant/20">
                  <Star className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant font-medium">You haven't reviewed any products yet.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
