import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, FileText, Upload } from "lucide-react";
import { Link } from "wouter";

interface VerificationStatusProps {
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  documentType?: string;
  documentUrl?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  showUploadButton?: boolean;
}

export function VerificationStatus({
  verificationStatus = 'pending',
  documentType,
  documentUrl,
  verificationNotes,
  verifiedAt,
  showUploadButton = true
}: VerificationStatusProps) {
  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case 'verified':
        return `Your ${documentType} has been successfully verified. You now have full access to all platform features.`;
      case 'rejected':
        return `Your ${documentType} verification was rejected. Please review the notes below and try again with a valid document.`;
      default:
        return `Your ${documentType} is being reviewed. This process typically takes 24-48 hours.`;
    }
  };

  const getProgressValue = () => {
    switch (verificationStatus) {
      case 'verified':
        return 100;
      case 'rejected':
        return 30;
      default:
        return 60;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Account Verification</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-lg">
              {verificationStatus === 'verified' && 'Account Verified'}
              {verificationStatus === 'rejected' && 'Verification Failed'}
              {verificationStatus === 'pending' && 'Verification in Progress'}
            </h4>
            <p className="text-muted-foreground text-sm">
              {getStatusDescription()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Verification Progress</span>
            <span>{getProgressValue()}%</span>
          </div>
          <Progress value={getProgressValue()} className="w-full" />
        </div>

        {/* Document Info */}
        {documentType && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Document Details</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document Type:</span>
                <span className="font-medium capitalize">
                  {documentType.replace('_', ' ')}
                </span>
              </div>
              {verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified On:</span>
                  <span className="font-medium">
                    {new Date(verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {verificationNotes && (
                <div className="mt-3">
                  <span className="text-muted-foreground block mb-1">Notes:</span>
                  <p className="text-sm bg-background p-2 rounded border">
                    {verificationNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {verificationStatus === 'rejected' && showUploadButton && (
            <Button asChild>
              <Link href="/document-signup">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Document
              </Link>
            </Button>
          )}
          {verificationStatus === 'pending' && (
            <Button variant="outline" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Awaiting Review
            </Button>
          )}
          {verificationStatus === 'verified' && (
            <Button variant="outline" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verified Account
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground">
          {verificationStatus === 'pending' && (
            <p>
              🕒 Our team is reviewing your document. You'll receive an email notification once the review is complete.
            </p>
          )}
          {verificationStatus === 'rejected' && (
            <p>
              📝 Please ensure your document is clear, valid, and not expired. All information must be visible and readable.
            </p>
          )}
          {verificationStatus === 'verified' && (
            <p>
              ✅ Your account is fully verified. You now have access to all creator features and can start earning from campaigns.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}