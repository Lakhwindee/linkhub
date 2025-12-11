import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Globe, Heart } from "lucide-react";

export default function Careers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground">
            Help us build the future of travel communities
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Why Work at ThePicStory?</h2>
            <p className="text-muted-foreground mb-6">
              We're on a mission to connect travelers worldwide and empower creators to monetize their passion. Join a team that's reshaping how people experience and share travel.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Collaborative Culture</h3>
                  <p className="text-sm text-muted-foreground">Work with a passionate, diverse team</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Remote-First</h3>
                  <p className="text-sm text-muted-foreground">Work from anywhere in the world</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Impact</h3>
                  <p className="text-sm text-muted-foreground">Build features used by travelers globally</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Growth</h3>
                  <p className="text-sm text-muted-foreground">Learn and grow with the company</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold text-lg">Senior Full Stack Engineer</h3>
                <p className="text-sm text-muted-foreground mb-2">Remote • Full-time</p>
                <p className="text-muted-foreground mb-3">
                  Help us build scalable features for our growing community platform
                </p>
                <Button variant="outline">Apply Now</Button>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold text-lg">Product Designer</h3>
                <p className="text-sm text-muted-foreground mb-2">Remote • Full-time</p>
                <p className="text-muted-foreground mb-3">
                  Design beautiful, intuitive experiences for travelers and creators
                </p>
                <Button variant="outline">Apply Now</Button>
              </div>

              <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-semibold text-lg">Community Manager</h3>
                <p className="text-sm text-muted-foreground mb-2">Remote • Full-time</p>
                <p className="text-muted-foreground mb-3">
                  Build and nurture our global travel community
                </p>
                <Button variant="outline">Apply Now</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented people. Send us your resume and tell us how you can contribute!
            </p>
            <Button size="lg">Send Your Resume</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
