// IPFS utilities for evidence upload
// Using web3.storage as the IPFS provider

export interface IPFSFile {
  name: string;
  type: string;
  size: number;
  content: File;
}

export interface EvidenceData {
  description: string;
  files: IPFSFile[];
  timestamp: number;
  bookingId: string;
}

// Mock IPFS upload function - replace with actual web3.storage implementation
export async function uploadToIPFS(
  evidenceData: EvidenceData
): Promise<string> {
  try {
    // In a real implementation, you would:
    // 1. Create a Web3.Storage client
    // 2. Upload files to IPFS
    // 3. Return the IPFS hash

    // For now, we'll simulate the upload process
    console.log("Uploading evidence to IPFS:", evidenceData);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate a mock IPFS hash
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    console.log("Evidence uploaded to IPFS:", mockHash);
    return mockHash;
  } catch (error) {
    console.error("Failed to upload to IPFS:", error);
    throw new Error("Failed to upload evidence to IPFS");
  }
}

// Function to retrieve evidence from IPFS
export async function getFromIPFS(hash: string): Promise<EvidenceData | null> {
  try {
    // In a real implementation, you would fetch from IPFS gateway
    console.log("Fetching evidence from IPFS:", hash);

    // For now, return mock data
    return {
      description: "Mock evidence description",
      files: [],
      timestamp: Date.now(),
      bookingId: "1",
    };
  } catch (error) {
    console.error("Failed to fetch from IPFS:", error);
    return null;
  }
}

// Validate file types and sizes for evidence upload
export function validateEvidenceFiles(files: File[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ];

  for (const file of files) {
    if (file.size > maxFileSize) {
      errors.push(`${file.name} is too large. Maximum size is 10MB.`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `${file.name} has an unsupported file type. Allowed types: images, videos, PDF.`
      );
    }
  }

  if (files.length > 5) {
    errors.push("Maximum 5 files allowed per evidence submission.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get IPFS gateway URL for displaying content
export function getIPFSGatewayUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`;
}
