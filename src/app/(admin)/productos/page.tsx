import { Package } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import { ProductosView } from './_components/productos-view'

export default async function ProductosPage() {
  const supabase = createServerSupabase()

  const [productosRes, categoriasRes, costosRes, mpRes, recetasRes] = await Promise.all([
    supabase
      .from('productos')
      .select('*, categorias_producto(nombre)')
      .order('categoria_id')
      .order('nombre'),
    supabase
      .from('categorias_producto')
      .select('id, nombre')
      .order('nombre'),
    supabase
      .from('v_costo_produccion')
      .select('*'),
    supabase
      .from('materias_primas')
      .select('id, nombre, unidad_medida, costo_unitario_actual')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('receta_ingredientes')
      .select('*, materias_primas(nombre, costo_unitario_actual)'),
  ])

  const productos = (productosRes.data ?? []).map((p) => ({
    ...p,
    categorias_producto: p.categorias_producto as { nombre: string } | null,
  }))
  const categorias = categoriasRes.data ?? []
  const costos = costosRes.data ?? []
  const materiasPrimas = mpRes.data ?? []
  const recetas = (recetasRes.data ?? []).map((r) => ({
    ...r,
    materias_primas: r.materias_primas as { nombre: string; costo_unitario_actual: number | null } | null,
  }))

  // Set of producto_ids that have at least one recipe ingredient
  const productosConRecetaIds = [...new Set(recetas.map((r) => r.producto_id))]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Package size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Productos</h1>
        </div>
      </div>
      <ProductosView
        productos={productos}
        categorias={categorias}
        costos={costos}
        materiasPrimas={materiasPrimas}
        recetas={recetas}
        productosConRecetaIds={productosConRecetaIds}
      />
    </div>
  )
}
