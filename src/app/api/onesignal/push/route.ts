import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { recipientId, likerName } = await request.json();

    if (!recipientId || !likerName) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing OneSignal config' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        include_external_user_ids: [recipientId],
        headings: { en: 'New Profile Like ❤️' },
        contents: { en: `${likerName} liked your profile.` },
      }),
      next: { revalidate: 0 },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.errors || result.message || 'OneSignal error' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
