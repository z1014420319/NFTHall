import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const PINATA_API_KEY = process.env.PINATA_API_KEY;

export async function POST(req: NextRequest) {
  if (req.url.includes("/image")) {
    try {
      // Parse the form data
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Convert File to Blob
      const fileBuffer = await file.arrayBuffer();
      const blob = new Blob([fileBuffer], { type: file.type });

      // Prepare form data for Pinata
      const pinataFormData = new FormData();
      pinataFormData.append("file", blob, file.name);
      pinataFormData.append("pinataMetadata", JSON.stringify({ name: file.name }));
      pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_API_KEY}`,
        },
        body: pinataFormData,
      });

      const data = await response.json();
      return NextResponse.json({ imageCID: data.IpfsHash });
    } catch (error) {
      console.error("Error uploading image:", error);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
  }

  if (req.url.includes("/metadata")) {
    const metadata = await req.json();

    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_API_KEY}`,
        },
        body: JSON.stringify(metadata),
      });

      const data = await response.json();
      return NextResponse.json({ metadataCID: data.IpfsHash });
    } catch (error) {
      console.error("Error uploading metadata:", error);
      return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
