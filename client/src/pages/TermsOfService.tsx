import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: October 2025</p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using HubLink, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
              <p className="text-muted-foreground mb-3">When you create an account with us, you must provide accurate and complete information. You are responsible for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Maintaining the security of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              <p className="text-muted-foreground mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Post offensive, harmful, or illegal content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Spam or send unsolicited messages</li>
                <li>Violate intellectual property rights</li>
                <li>Attempt to hack or disrupt the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Creator Program</h2>
              <p className="text-muted-foreground">
                Creators participating in brand campaigns must comply with campaign guidelines, create original content, and submit work within deadlines. Payment is subject to admin approval and verification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Publisher Terms</h2>
              <p className="text-muted-foreground">
                Publishers creating campaigns must provide accurate campaign briefs, make timely payments, and treat creators professionally. All campaigns are subject to platform review.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Payment Terms</h2>
              <p className="text-muted-foreground">
                All payments are processed through Stripe. Subscription fees are non-refundable. Creator payouts are subject to tax withholding based on country of residence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you post. By posting content, you grant HubLink a license to display, distribute, and promote your content on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account immediately for any violation of these Terms. You may also delete your account at any time from your profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                HubLink shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact</h2>
              <p className="text-muted-foreground">
                Questions about the Terms of Service should be sent to legal@hublink.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
