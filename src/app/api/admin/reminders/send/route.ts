import { NextRequest, NextResponse } from "next/server";
import {
  MenuKey,
  getPicConfigs,
  sendAllMenuDigests,
  sendMenuDigestEmail,
} from "@/lib/services/email/reminder-digest.service";

export async function GET() {
  try {
    const picConfigs = getPicConfigs();
    return NextResponse.json({
      success: true,
      sender: {
        name: process.env.SMTP_FROM_NAME || "Harmoni System",
        email: process.env.SMTP_USER || "izaky.thb@gmail.com",
      },
      pics: picConfigs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { menu, targetEmailOverride } = body as {
      menu?: "all" | MenuKey;
      targetEmailOverride?: string;
    };

    if (menu && menu !== "all") {
      const result = await sendMenuDigestEmail(menu, targetEmailOverride);
      return NextResponse.json({
        success: result.success,
        menu,
        targetEmail: targetEmailOverride || getPicConfigs()[menu].email,
        result,
      });
    }

    // Send to all
    const results = await sendAllMenuDigests(targetEmailOverride);
    return NextResponse.json({
      success: true,
      mode: "all",
      targetEmailOverride: targetEmailOverride || "Individual PICs",
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
