import { Card, CardContent } from "@/components/ui/card";
import { Globe, Heart, Users, TrendingUp } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About HubLink</h1>
          <p className="text-xl text-muted-foreground">
            Connecting travelers and creators worldwide
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground text-lg">
                HubLink was created to build the world's largest travel community where travelers can connect, share experiences, and creators can monetize their passion for travel and content creation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground">
                Founded in 2024, HubLink started with a simple idea: travelers deserve a dedicated platform to connect with like-minded explorers around the world. We've evolved into a comprehensive ecosystem that not only facilitates connections but also empowers creators to earn from their content through our innovative ad marketplace.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <Globe className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Global Reach</h3>
              <p className="text-muted-foreground">Connecting travelers from 180+ countries worldwide</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Users className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Community First</h3>
              <p className="text-muted-foreground">Building authentic relationships between travelers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Heart className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Creator Support</h3>
              <p className="text-muted-foreground">Helping creators earn $2M+ through brand partnerships</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <TrendingUp className="w-12 h-12 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Always Growing</h3>
              <p className="text-muted-foreground">Continuously improving with new features and tools</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <span className="font-semibold text-foreground">Authenticity:</span> We believe in genuine connections and authentic content
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <span className="font-semibold text-foreground">Community:</span> Our users are at the heart of everything we do
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <span className="font-semibold text-foreground">Innovation:</span> We constantly evolve to meet the needs of modern travelers
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <span className="font-semibold text-foreground">Integrity:</span> We operate with transparency and fairness in all interactions
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
