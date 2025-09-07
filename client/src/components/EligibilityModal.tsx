import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Users, Trophy } from "lucide-react";

interface EligibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSubscribers: number;
  requiredSubscribers: number;
}

export function EligibilityModal({ 
  open, 
  onOpenChange, 
  currentSubscribers, 
  requiredSubscribers 
}: EligibilityModalProps) {
  const missingSubscribers = requiredSubscribers - currentSubscribers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">Channel Not Eligible</DialogTitle>
          <DialogDescription className="text-base">
            Your YouTube channel doesn't meet the minimum requirements for ad campaigns.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Subscriber Requirements</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Subscribers:</span>
                <span className="font-mono">{currentSubscribers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Required:</span>
                <span className="font-mono font-semibold">{requiredSubscribers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                <span>Still Needed:</span>
                <span className="font-mono font-bold">{missingSubscribers.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-blue-600 mt-0.5 dark:text-blue-400" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Keep Growing Your Channel!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Once you reach {requiredSubscribers.toLocaleString()}+ subscribers, you'll be eligible for premium ad campaigns and higher earnings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Got It, Thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}