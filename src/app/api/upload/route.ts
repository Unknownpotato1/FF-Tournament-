import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadScreenshot, uploadAvatar } from "@/lib/cloudinary";

// POST /api/upload — upload payment screenshot OR user avatar to Cloudinary
// Accepts multipart/form-data with:
//   - "file" (required): the image file
//   - "type" (optional): "payment" (default) or "avatar"
// Returns { ok: true, url, publicId } on success.
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const type = (formData.get("type") as string) || "payment";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File too large (max 2MB)" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only image files allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let result;
    if (type === "avatar") {
      // Avatars go to a different folder, get square-cropped transformation
      result = await uploadAvatar(buffer, user.uid, file.name);
    } else {
      // Default: payment screenshot
      result = await uploadScreenshot(buffer, user.uid, file.name);
    }

    return NextResponse.json({
      ok: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
