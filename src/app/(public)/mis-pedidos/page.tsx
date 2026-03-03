import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getServerDictionary } from '../_dictionaries/server'
import { obtenerMisPedidos } from '../checkout/actions'
import { MisPedidosContent } from './mis-pedidos-content'

export const metadata = {
  title: 'Mis pedidos | Oro de Tamar',
}

export default async function MisPedidosPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const dictionary = await getServerDictionary()
  const pedidos = await obtenerMisPedidos()

  return (
    <MisPedidosContent dictionary={dictionary} pedidos={pedidos} />
  )
}
