// app/api/verify/route.ts
import { NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// --- Your Backend Verification Configuration ---
// This configuration MUST EXACTLY MATCH the 'disclosures' in your frontend component.
const verificationConfig = {
  minimumAge: 18,
  // You can add other rules here like excludedCountries or ofac checks.
};

// Initialize the verifier. It's best to do this once outside the request handler.
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE!, // The same scope from .env.local
  process.env.NEXT_PUBLIC_SELF_ENDPOINT!, // The same endpoint from .env.local
  true, // mockPassport: true for testing with mock documents (staging).
  AllIds, // Allows all document types (Passport, ID Card, etc.).
  new DefaultConfigStore(verificationConfig), // Your verification rules.
  "hex" // The user identifier type, matching the frontend.
);

export async function POST(req: Request) {
  try {
    const { attestationId, proof, publicSignals, userContextData } =
      await req.json();

    // Basic validation to ensure we have the data we need.
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        { message: "Missing required fields for verification." },
        { status: 400 }
      );
    }

    // The core verification step.
    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    // Check if the proof is cryptographically valid and meets our rules.
    if (result.isValidDetails.isValid) {
      // IMPORTANT: At this point, verification is successful!
      // You should now:
      // 1. Get the user's ID: result.userData.userIdentifier
      // 2. Save their verified status to your database.
      // 3. Grant them access, mint an NFT, etc.

      console.log(
        "Verification success for user:",
        result.userData.userIdentifier
      );
      console.log("Disclosed data:", result.discloseOutput);

      return NextResponse.json({ status: "success", result: true });
    } else {
      // If verification fails.
      console.error("Verification failed:", result.isValidDetails);
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Proof verification failed.",
      });
    }
  } catch (error: unknown) {
    // Handle unexpected errors, including configuration mismatches.
    if (error && typeof error === 'object' && 'name' in error && error.name === "ConfigMismatchError") {
      console.error("Configuration mismatch:", (error as unknown as { issues: unknown }).issues);
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Configuration mismatch.",
      });
    }
    console.error("An unexpected error occurred:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      reason: "An internal server error occurred.",
    });
  }
}
