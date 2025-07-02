"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Account Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you create an account, we collect your email address and any profile information you choose to provide. We may also collect authentication information if you sign in through third-party services like Google.
                </p>
                <h3 className="text-lg font-medium">Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information about how you use hellafocused, including tasks you create, projects you manage, features you use, and how you interact with the Service.
                </p>
                <h3 className="text-lg font-medium">Device Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may collect device identifiers, browser type, operating system, and other technical information to provide cross-device synchronization and improve our Service.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Synchronize your data across devices</li>
                <li>Authenticate your identity and prevent unauthorized access</li>
                <li>Send you important updates about the Service</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Provide customer support and respond to your inquiries</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except as described in this policy:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>With service providers who help us operate the Service (under strict confidentiality agreements)</li>
                <li>In connection with a merger, acquisition, or sale of business assets</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure authentication protocols, and regular security assessments.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only as long as necessary to provide the Service and fulfill the purposes outlined in this policy. When you delete your account, we will delete your personal information, except where retention is required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain communications</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings, but disabling them may affect the functionality of the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may integrate with third-party services (such as Google for authentication). These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@hellafocused.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 