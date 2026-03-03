import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getServerDictionary } from '../_dictionaries/server'
import { obtenerDatosBancarios } from './actions'
import { CheckoutContent } from './checkout-content'
import { CheckoutSignIn } from './checkout-sign-in'

export const metadata = {
  title: 'Confirmar pedido | Oro de Tamar',
}

export default async function CheckoutPage() {
  const { userId } = await auth()
  const dictionary = await getServerDictionary()

  if (!userId) {
    return <CheckoutSignIn dictionary={dictionary} />
  }

  const supabase = createServerSupabase()

  const [datosBancarios, { data: productos }] = await Promise.all([
    obtenerDatosBancarios(),
    supabase
      .from('productos')
      .select('id, nombre, presentacion, peso_gramos, precio_venta, imagen_url')
      .eq('activo', true)
      .order('nombre'),
  ])

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  return (
    <CheckoutContent
      dictionary={dictionary}
      datosBancarios={datosBancarios}
      productos={productos ?? []}
      whatsapp={whatsapp}
    />
  )
}
