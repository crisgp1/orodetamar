import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getDictionary, defaultLocale } from '../_dictionaries'
import { obtenerMisPedidos } from '../checkout/actions'
import { MisPedidosContent } from './mis-pedidos-content'

export const metadata = {
  title: 'Mis pedidos | Oro de Tamar',
}

export default async function MisPedidosPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const dictionary = getDictionary(defaultLocale)
  const pedidos = await obtenerMisPedidos()

  return (
    <MisPedidosContent dictionary={dictionary} pedidos={pedidos} />
  )
}
