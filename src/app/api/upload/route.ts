import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadScreenshot } from "@/lib/cloudinary";

// POST /api/upload — upload payment screenshot to Cloudinary
// Accepts multipart/form-data with a "file" field.
// Returns { ok: true, url, publicId } on success.
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
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
    const result = await uploadScreenshot(buffer, user.uid, file.name);

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
