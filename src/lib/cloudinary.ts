// Cloudinary server-side helper — used to upload payment screenshots
// Cloudinary free tier (25 credits/month) is more than enough for screenshots.
// Firebase Storage was replaced because Firebase Storage now requires Blaze (paid) plan.

import { v2 as cloudinary } from "cloudinary";

let configured = false;

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET env vars."
    );
  }
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
}

function ensureConfigured() {
  if (!configured) {
    cloudinary.config(getConfig());
    configured = true;
  }
}

/**
 * Upload a file buffer to Cloudinary with a structured folder path.
 * Returns the secure URL + public ID (for future deletion if needed).
 */
export async function uploadScreenshot(
  buffer: Buffer,
  userId: string,
  originalName: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
  const folder = `ff-tournament/payments/${userId}`;
  const publicId = `${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          // Limit transformations to keep storage small (free tier friendly)
          transformation: [{ width: 1200, height: 1600, crop: "limit", quality: "auto" }],
        },
        (err, result) => {
          if (err) {
            reject(new Error(err.message || "Cloudinary upload failed"));
            return;
          }
          if (!result) {
            reject(new Error("Cloudinary returned no result"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      )
      .end(buffer);
  });
}

export function getCloudName(): string {
  return process.env.CLOUDINARY_CLOUD_NAME || "";
}
