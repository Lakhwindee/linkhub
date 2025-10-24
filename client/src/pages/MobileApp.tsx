import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MobileApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h1 className="text-5xl font-bold mb-4">Mobile App</h1>
          <div className="inline-block px-6 py-2 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
            <p className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
              Coming Soon
            </p>
          </div>
          <p className="text-xl text-muted-foreground">
            Experience HubLink on the go
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">We're Building Something Great</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our mobile app is currently in development and will be available soon on iOS and Android. Get ready for a seamless travel community experience in the palm of your hand.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-2">📱</div>
                <h3 className="font-semibold mb-2">Native Experience</h3>
                <p className="text-sm text-muted-foreground">Optimized for mobile devices</p>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🔔</div>
                <h3 className="font-semibold mb-2">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">Stay updated on the go</p>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Smooth and responsive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Bell className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Get Notified</h2>
              <p className="text-muted-foreground">
                Be the first to know when our mobile app launches
              </p>
            </div>

            <form className="max-w-md mx-auto">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="your.email@example.com"
                  className="flex-1"
                />
                <Button type="submit">
                  Notify Me
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                We'll send you an email when the app is available for download
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-muted-foreground">
          <p>In the meantime, access HubLink from any browser on your mobile device</p>
        </div>
      </div>
    </div>
  );
}
