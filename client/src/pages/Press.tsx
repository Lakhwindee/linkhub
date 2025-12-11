import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Download, Mail } from "lucide-react";

export default function Press() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Press & Media</h1>
          <p className="text-xl text-muted-foreground">
            Latest news and resources for journalists
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4 mb-6">
              <Newspaper className="w-12 h-12 text-primary flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-2">About ThePicStory</h2>
                <p className="text-muted-foreground">
                  ThePicStory is the world's leading travel community platform, connecting travelers from 180+ countries and empowering creators to monetize their content through brand partnerships. With over 50,000 active users and $2M+ in creator earnings, we're reshaping how people experience and share travel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Press Kit</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Company Logo Pack</h3>
                    <p className="text-sm text-muted-foreground">PNG, SVG formats</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Brand Guidelines</h3>
                    <p className="text-sm text-muted-foreground">PDF format</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Company Fact Sheet</h3>
                    <p className="text-sm text-muted-foreground">PDF format</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Recent News</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <p className="text-sm text-muted-foreground mb-1">October 2025</p>
                <h3 className="font-semibold text-lg mb-2">ThePicStory Surpasses $2M in Creator Earnings</h3>
                <p className="text-muted-foreground">Platform reaches major milestone as creators earn over $2 million through brand partnerships...</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <p className="text-sm text-muted-foreground mb-1">September 2025</p>
                <h3 className="font-semibold text-lg mb-2">50,000 Travelers Join ThePicStory Community</h3>
                <p className="text-muted-foreground">Travel platform celebrates rapid growth across 180+ countries...</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <p className="text-sm text-muted-foreground mb-1">August 2025</p>
                <h3 className="font-semibold text-lg mb-2">ThePicStory Launches Creator Tier System</h3>
                <p className="text-muted-foreground">New 15-tier system helps creators of all sizes monetize their content...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
            <p className="text-muted-foreground mb-6">
              For press inquiries, interviews, or more information, please contact our media team
            </p>
            <Button size="lg">
              <Mail className="w-4 h-4 mr-2" />
              press@thepicstory.com
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
