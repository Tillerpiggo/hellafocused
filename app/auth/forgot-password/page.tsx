"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const hasInput = email.trim() !== ""

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Back Button */}
        <div className="p-6">
                  <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/app")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        </div>

        {/* Success Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                We&apos;ve sent you a password reset link. Please check your email and follow the instructions to reset your password.
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              If an account with that email exists, you&apos;ll receive a password reset link shortly.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/app")} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back Button */}
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/auth/log-in")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder="benjamin.lasky@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className={`w-full ${!hasInput ? 'bg-muted/80 text-foreground/60 hover:bg-muted/80 cursor-not-allowed border border-border' : ''}`}
              disabled={loading || !hasInput}
              variant={hasInput ? "default" : "ghost"}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

        </div>
      </div>

      {/* Terms - Only visible when scrolling down */}
      <div className="pb-6 px-6 pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By using our service, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 