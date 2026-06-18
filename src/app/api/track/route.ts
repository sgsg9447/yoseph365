import { NextResponse, type NextRequest } from "next/server";
import { trackEventSchema } from "@/lib/validations/forms";
import { logEvent } from "@/lib/analytics/events";

/** 범용 이벤트 트래킹 수신부. anon이 INSERT만 가능(RLS). 실패해도 페이지를 깨지 않게 200으로 응답. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = trackEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await logEvent(parsed.data.name, { courseId: parsed.data.courseId ?? null });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
