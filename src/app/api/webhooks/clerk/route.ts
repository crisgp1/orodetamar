import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createServerSupabase } from '@/lib/supabase/server'
import { clerkClient } from '@clerk/nextjs/server'

type WebhookEvent = {
  type: string
  data: {
    id: string
    first_name?: string | null
    last_name?: string | null
    email_addresses: { email_address: string }[]
  }
}

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!SIGNING_SECRET) {
    return Response.json({ error: 'Missing CLERK_WEBHOOK_SIGNING_SECRET' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(SIGNING_SECRET)

  let evt: WebhookEvent
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerSupabase()

  if (evt.type === 'user.created') {
    const nombre =
      `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim() || 'Usuario'
    const email = evt.data.email_addresses[0]?.email_address

    await supabase.from('perfiles').insert({
      clerk_id: evt.data.id,
      nombre,
      email,
      rol: 'APOYO',
    })

    const client = await clerkClient()
    await client.users.updateUserMetadata(evt.data.id, {
      publicMetadata: { rol: 'APOYO' },
    })
  }

  if (evt.type === 'user.updated') {
    const nombre =
      `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim() || 'Usuario'
    const email = evt.data.email_addresses[0]?.email_address

    await supabase
      .from('perfiles')
      .update({ nombre, email })
      .eq('clerk_id', evt.data.id)
  }

  if (evt.type === 'user.deleted') {
    await supabase
      .from('perfiles')
      .update({ activo: false })
      .eq('clerk_id', evt.data.id)
  }

  return Response.json({ ok: true })
}
