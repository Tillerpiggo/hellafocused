"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { GoogleLogo } from "@/components/ui/google-logo"
import { supabase, getBaseUrl } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { syncEngine } from "@/lib/sync-engine"

export default function LogInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const hasInput = email.trim() !== "" || password.trim() !== ""

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Mark this as a login flow (not account creation)
      sessionStorage.setItem('auth-flow-type', 'login')
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      syncEngine.syncPendingChanges()

      // Redirect to app or landing page based on environment
      router.push("/app")
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      // Mark this as a login flow (not account creation)
      sessionStorage.setItem('auth-flow-type', 'login')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        },
      })

      if (error) throw error

      syncEngine.syncPendingChanges()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setLoading(false)
    }
  }

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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Log in to hellafocused</h1>
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Log In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className={`w-full ${!hasInput ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-not-allowed' : ''}`}
              disabled={loading || !hasInput}
              variant={hasInput ? "default" : "ghost"}
            >
              {loading ? "Logging in..." : "Log In"}
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

          {/* Google Log In */}
          <Button
            variant="outline"
            className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-gray-700 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:hover:border-blue-700 dark:text-blue-100"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleLogo className="mr-2" />
            Login with Google
          </Button>
        </div>
      </div>

      {/* Terms - Only visible when scrolling down */}
      <div className="pb-6 px-6 pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By logging in, you agree to our{" "}
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