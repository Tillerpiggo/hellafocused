"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using hellafocused ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                hellafocused is a task management and productivity application that allows users to create, organize, and track tasks and projects. The service includes features for task creation, project management, data synchronization across devices, and collaboration tools.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. User Data and Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all content and data you submit to the Service. By using our Service, you grant us the right to store, process, and transmit your data as necessary to provide the Service. We are committed to protecting your privacy as outlined in our Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, overburden, or impair the Service. You may not attempt to gain unauthorized access to any part of the Service, other accounts, or any connected systems.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide reliable service but cannot guarantee that the Service will be available at all times. We may temporarily suspend the Service for maintenance, updates, or other operational reasons. We are not liable for any inconvenience or loss resulting from service interruptions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" without warranties of any kind. We shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the Service, even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service at any time, with or without notice, for any reason including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any significant changes via email or through the Service. Your continued use of the Service after changes are posted constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at legal@hellafocused.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 