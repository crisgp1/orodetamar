import { MapPin } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import { UbicacionesView } from './_components/ubicaciones-view'

export default async function UbicacionesPage() {
  const supabase = createServerSupabase()

  const { data: ubicaciones } = await supabase
    .from('ubicaciones')
    .select('*')
    .order('nombre')

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <MapPin size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Ubicaciones</h1>
        </div>
      </div>
      <UbicacionesView ubicaciones={ubicaciones ?? []} />
    </div>
  )
}
