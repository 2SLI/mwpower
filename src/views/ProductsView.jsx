import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { NewProductsSection } from '../features/products/components/NewProductsSection'
import { ProductCategoryCrumb } from '../features/products/components/ProductCategoryCrumb'
import { ProductResults } from '../features/products/components/ProductResults'
import { ProductSearchHeader } from '../features/products/components/ProductSearchHeader'
import { useProductsController } from '../features/products/hooks/useProductsController'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export function ProductsView(props) {
  const { view, actions, refs } = useProductsController(props)

  return (
    <section className={`${view.isActive ? '' : 'is-hidden'} min-h-[1200px] overflow-x-hidden bg-slate-100 pb-16 max-[640px]:min-h-0 max-[640px]:pb-10`} id="product-page">
      <ProductCategoryCrumb view={view} actions={actions} refs={refs} />

      <div className="mx-auto mt-8 max-w-[1160px] px-3 max-[980px]:mt-6">
        <div className="product-main min-w-0">
          <ProductSearchHeader view={view} actions={actions} />
          <ProductResults view={view} actions={actions} refs={refs} />
          <NewProductsSection show={view.showNewProducts} />
        </div>
      </div>
    </section>
  )
}
