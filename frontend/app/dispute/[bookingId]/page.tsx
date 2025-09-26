"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useReservationStatus,
  useRentalContractWrite,
  formatNativeToken,
  getReservationStateLabel,
  getReservationStateColor,
} from "@/lib/hooks/useRentalContract";
import { properties } from "@/data/properties";
import {
  uploadToIPFS,
  validateEvidenceFiles,
  formatFileSize,
  type EvidenceData,
} from "@/lib/ipfs";
import { toast } from "sonner";
import {
  AlertTriangle,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  CheckCircle,
  Clock,
  Shield,
  Gavel,
  ArrowLeft,
} from "lucide-react";

export default function DisputePage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const bookingId = BigInt(params.bookingId);
  const { data: reservation } = useReservationStatus(bookingId);
  const { submitEvidence, isPending } = useRentalContractWrite();

  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  // Find the property associated with this booking
  const property = reservation
    ? properties.find((p) => p.listingId === reservation[1])
    : null;

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validation = validateEvidenceFiles(files);

      if (!validation.valid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      setSelectedFiles(files);
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmitEvidence = async () => {
    if (!isConnected || !reservation) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description of the dispute");
      return;
    }

    try {
      setIsUploading(true);

      // Prepare evidence data for IPFS upload
      const evidenceData: EvidenceData = {
        description: description.trim(),
        files: selectedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: file,
        })),
        timestamp: Date.now(),
        bookingId: params.bookingId,
      };

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(evidenceData);

      // Submit evidence hash to smart contract
      await submitEvidence(bookingId, ipfsHash);

      setEvidenceSubmitted(true);
      toast.success("Evidence submitted successfully!");
    } catch (error) {
      console.error("Failed to submit evidence:", error);
      toast.error("Failed to submit evidence. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.startsWith("video/")) return Video;
    return FileText;
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h1 className="text-2xl font-semibold mb-4">
                Connect Your Wallet
              </h1>
              <p className="text-muted-foreground">
                Connect your wallet to access the dispute resolution system.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h1 className="text-2xl font-semibold mb-4">Booking Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The booking you&apos;re trying to dispute doesn&apos;t exist or
                you don&apos;t have access to it.
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (evidenceSubmitted) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h1 className="text-2xl font-semibold mb-4">
                Evidence Submitted
              </h1>
              <p className="text-muted-foreground mb-6">
                Your evidence has been successfully submitted to the blockchain.
                The dispute resolution process will now begin.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEvidenceSubmitted(false)}
                  className="w-full"
                >
                  Submit Additional Evidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const reservationState = reservation[7] as number;
  const isOwner =
    address &&
    reservation[3] &&
    address.toLowerCase() === reservation[3].toLowerCase();
  const isRenter =
    address &&
    reservation[9] &&
    address.toLowerCase() === reservation[9].toLowerCase();
  const isBroker =
    address &&
    reservation[2] &&
    address.toLowerCase() === reservation[2].toLowerCase();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Gavel className="h-8 w-8 text-red-500" />
                Dispute Resolution
              </h1>
              <p className="text-muted-foreground">
                Submit evidence for booking #{params.bookingId}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property && (
                <div className="flex gap-4">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    <p className="text-muted-foreground">{property.city}</p>
                    <Badge
                      className={getReservationStateColor(reservationState)}
                    >
                      {getReservationStateLabel(reservationState)}
                    </Badge>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Booking ID</p>
                  <p className="font-mono">{params.bookingId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Paid</p>
                  <p className="font-semibold">
                    {formatNativeToken(reservation[10])} 0G
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Role</p>
                  <p className="font-medium">
                    {isOwner
                      ? "Property Owner"
                      : isRenter
                        ? "Renter"
                        : isBroker
                          ? "Broker"
                          : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="destructive">In Dispute</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Provide a detailed description of the issue and upload any
                  supporting evidence. All evidence will be stored on IPFS and
                  linked to the blockchain for transparency.
                </AlertDescription>
              </Alert>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description of the Issue</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail. Include dates, times, and specific problems you encountered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  {description.length}/1000 characters
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Label>Supporting Evidence (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload images, videos, or documents to support your case
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <Label htmlFor="evidence-upload" className="cursor-pointer">
                    <Button type="button" variant="outline">
                      Choose Files
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max 5 files, 10MB each. Supported: Images, Videos, PDF
                  </p>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files</Label>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileIcon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSubmitEvidence}
                  disabled={!description.trim() || isUploading || isPending}
                  className="flex-1"
                >
                  {isUploading
                    ? "Uploading to IPFS..."
                    : isPending
                      ? "Submitting..."
                      : "Submit Evidence"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How Dispute Resolution Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Submit Evidence</p>
                    <p className="text-sm text-muted-foreground">
                      Provide a detailed description and upload supporting files
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Review Period</p>
                    <p className="text-sm text-muted-foreground">
                      All parties can submit evidence during the review period
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Resolution</p>
                    <p className="text-sm text-muted-foreground">
                      Arbitrators review evidence and make a binding decision
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
