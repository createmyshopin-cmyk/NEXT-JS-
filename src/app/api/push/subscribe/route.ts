import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    // Verify the caller's JWT from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Validate the token and retrieve the authenticated user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userData.user.id;

    const { subscription, tenantId, userId } = await req.json();

    if (!subscription || !tenantId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the caller can only register subscriptions for their own user ID
    if (userId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden: userId mismatch' }, { status: 403 });
    }

    // Verify that the authenticated user owns the supplied tenantId
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('user_id', authenticatedUserId)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Forbidden: tenant not owned by user' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        tenant_id: tenantId,
        user_id: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('Subscription error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
