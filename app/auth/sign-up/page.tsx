"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleLogo } from "@/components/ui/google-logo"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { syncEngine } from "@/lib/sync-engine"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const hasInput = email.trim() !== "" || password.trim() !== ""

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      // Mark this as a sign-up flow for potential anonymous migration
      sessionStorage.setItem('auth-flow-type', 'signup')
      
      // Store current anonymous user ID if one exists (for potential migration)
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.is_anonymous) {
        sessionStorage.setItem('previous-anonymous-user-id', user.id)
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      console.error('❌ Error signing up:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError("")

    try {
      // Mark this as a sign-up flow for potential anonymous migration
      sessionStorage.setItem('auth-flow-type', 'signup')
      
      // Store current anonymous user ID if one exists (for potential migration)
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.is_anonymous) {
        sessionStorage.setItem('previous-anonymous-user-id', user.id)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        },
      })

      if (error) throw error

      syncEngine.syncPendingChanges()
    } catch (error: any) {
      setError(error.message)
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
            onClick={() => router.push("/")}
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
                We've sent you a confirmation link. Please check your email and click the link to verify your account.
                <br />
                If you don't see an email, check your spam folder.
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              A confirmation email has been sent to <strong>{email}</strong>
            </div>
            <Button onClick={() => router.push("/")} className="w-full">
              Got it
            </Button>
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
          onClick={() => router.push("/")}
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
            <h1 className="text-2xl font-bold">Create a hellafocused account</h1>
            {/* Sign In Link */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                                                  Already have an account?{" "}
                 <Link
                   href="/auth/log-in"
                   className="text-primary hover:underline font-semibold"
                 >
                   Log in
                 </Link>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="benjamin.lasky@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className={`w-full ${!hasInput ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-not-allowed' : ''}`}
              disabled={loading || !hasInput}
              variant={hasInput ? "default" : "ghost"}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            variant="default"
            className="w-full bg-primary/90 hover:bg-primary text-primary-foreground"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <GoogleLogo className="mr-2" />
            Sign up with Google
          </Button>
        </div>
      </div>

      {/* Terms - Only visible when scrolling down */}
      <div className="pb-6 px-6 pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
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