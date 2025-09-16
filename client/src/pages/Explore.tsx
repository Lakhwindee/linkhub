import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Package, UserCheck } from "lucide-react";
import Stays from "./Stays";
import TourPackages from "./TourPackages";
import PersonalHosts from "./PersonalHosts";

export default function Explore() {
  const [activeTab, setActiveTab] = useState("stays");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Explore Services</h1>
          <p className="text-lg text-muted-foreground">
            Discover accommodations, tour packages, and personal hosts all in one place
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stays" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Stays
            </TabsTrigger>
            <TabsTrigger value="tour-packages" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tour Packages
            </TabsTrigger>
            <TabsTrigger value="personal-hosts" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Personal Hosts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stays" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Accommodation & Stays
                </CardTitle>
                <CardDescription>
                  Find and book comfortable accommodations for your travels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Stays />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tour-packages" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Tour Packages
                </CardTitle>
                <CardDescription>
                  Explore exciting tour packages and travel experiences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TourPackages />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal-hosts" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Personal Hosts
                </CardTitle>
                <CardDescription>
                  Connect with local hosts for personalized experiences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PersonalHosts />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}