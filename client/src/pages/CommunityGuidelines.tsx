import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Users, Flag } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-xl text-muted-foreground">
            Creating a safe and welcoming community for all travelers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Be Respectful</h3>
              <p className="text-muted-foreground">Treat others with kindness and respect</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Stay Safe</h3>
              <p className="text-muted-foreground">Protect your privacy and personal information</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Be Authentic</h3>
              <p className="text-muted-foreground">Share genuine experiences and content</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Flag className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Report Issues</h3>
              <p className="text-muted-foreground">Help us maintain a safe community</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Our Principles</h2>
              <p className="text-muted-foreground">
                ThePicStory is a platform for travelers to connect, share experiences, and grow together. We believe in creating a positive, inclusive, and safe environment for everyone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">What We Encourage</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Sharing authentic travel experiences and tips</li>
                <li>Constructive and helpful feedback</li>
                <li>Supporting fellow travelers</li>
                <li>Cultural exchange and learning</li>
                <li>Professional collaboration between creators and publishers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">What We Don't Allow</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Harassment, bullying, or hate speech</li>
                <li>Spam or misleading content</li>
                <li>Illegal activities or content</li>
                <li>Impersonation or fake accounts</li>
                <li>Sexually explicit or violent content</li>
                <li>Copyright infringement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Reporting Violations</h2>
              <p className="text-muted-foreground">
                If you see content or behavior that violates these guidelines, please report it immediately. Our moderation team reviews all reports and takes appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Consequences</h2>
              <p className="text-muted-foreground">
                Violations may result in content removal, account suspension, or permanent ban depending on severity. We reserve the right to take action at our discretion to protect the community.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
