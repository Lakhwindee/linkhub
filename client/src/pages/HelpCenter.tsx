import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Book } from "lucide-react";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground">
            Get the support you need to make the most of ThePicStory
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Book className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse our comprehensive guides and tutorials
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chat with our support team in real-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="w-12 h-12 mb-4 text-primary" />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Send us a detailed message and we'll respond within 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">How do I create an account?</h3>
              <p className="text-muted-foreground">
                Click on "Get Started" and follow the signup process. You'll need to verify your email address to complete registration.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">How can I earn money on ThePicStory?</h3>
              <p className="text-muted-foreground">
                Creators with verified YouTube channels can reserve brand campaigns, create content, and earn money after admin approval. Premium plan required.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">What are the payment methods?</h3>
              <p className="text-muted-foreground">
                We support all major credit cards and debit cards through Stripe. For creator payouts, you'll need to connect your Stripe account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">How do I verify my YouTube channel?</h3>
              <p className="text-muted-foreground">
                Go to your profile settings, enter your YouTube channel URL, add the verification code to your channel description, and click verify.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Still need help?</p>
          <Button size="lg">Contact Support</Button>
        </div>
      </div>
    </div>
  );
}
