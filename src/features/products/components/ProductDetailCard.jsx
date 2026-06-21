import { formatInventoryText, formatProductPriceText } from '../../inventory/inventoryUtils'
import { decodeAssetUrl } from '../productViewUtils'
import { FeatureList } from './LeafRecordCard'
import { ModelActionList } from './ModelActionList'
import { ProductOptionPanel } from './ProductOptionPanel'
import { ProductPdfViewer } from './ProductPdfViewer'

export function ProductDetailCard({
  view,
  actions,
  refs,
}) {
  const {
    activeMajor,
    activeMajorId,
    activeSubcategory,
    activeLeaf,
    activeGroup,
    selectedGroupName,
    leafView,
    modelCards,
    selectedModelCard,
    selectedOptionModel,
    selectedCombinedOptionModels,
    selectedQuoteQuantity,
    selectedPdfUrl,
    isMobileViewport,
    mobilePdfNumPages,
    mobilePdfPageWidth,
    inventoryContext,
    isShopSite,
  } = view

  const routePayload = {
    majorId: activeMajorId,
    majorName: activeMajor?.name,
    subcategory: activeSubcategory,
    leaf: activeLeaf,
    groupName: selectedGroupName ?? activeGroup,
    thumbnailUrl: leafView?.thumbnailUrl,
    wattage: leafView?.wattage,
  }

  return (
    <article
      ref={refs.productDetailRef}
      className={`scroll-mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-[640px]:gap-3 max-[640px]:p-3 ${
        isShopSite ? 'min-h-[980px] max-[640px]:min-h-0' : ''
      }`}
    >
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(390px,460px)]">
        <div className="grid content-start gap-4">
          <ProductHeroImage leafView={leafView} activeLeaf={activeLeaf} selectedModelCard={selectedModelCard} isShopSite={isShopSite} />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 mt-0 text-[15px] font-bold text-slate-800">Model</p>
            <ModelActionList
              items={modelCards}
              activeModel={view.activeModel}
              isShopSite={isShopSite}
              inventoryContext={inventoryContext}
              onSelectModel={(item) => actions.onModelClick(item.modelName)}
            />
          </div>

          {isShopSite ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <FeatureList features={leafView.features} itemKey="detail-feature" />
            </div>
          ) : null}
        </div>

        <div className={`self-start ${isShopSite ? 'lg:sticky lg:top-4' : ''}`}>
          <ProductInfoPanel view={view} actions={actions} routePayload={routePayload} />
        </div>
      </section>

      <ProductPdfViewer
        selectedModelCard={selectedModelCard}
        selectedPdfUrl={selectedPdfUrl}
        isMobileViewport={isMobileViewport}
        mobilePdfViewportRef={refs.mobilePdfViewportRef}
        mobilePdfNumPages={mobilePdfNumPages}
        mobilePdfPageWidth={mobilePdfPageWidth}
        onMobileLoadSuccess={({ numPages }) => actions.setMobilePdfNumPages(numPages)}
        onMobileLoadError={() => actions.setMobilePdfNumPages(0)}
        pdfSectionRef={refs.pdfSectionRef}
      />
    </article>
  )
}

function ProductHeroImage({ leafView, activeLeaf, selectedModelCard, isShopSite }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={`grid place-items-center bg-white p-8 max-[640px]:min-h-[300px] max-[640px]:p-4 ${isShopSite ? 'min-h-[520px] max-[980px]:min-h-[420px]' : 'min-h-[380px] max-[980px]:min-h-[340px]'}`}>
        {leafView.thumbnailUrl ? (
          <img src={decodeAssetUrl(leafView.thumbnailUrl)} alt={activeLeaf} className="block max-h-[430px] w-full object-contain max-[640px]:max-h-[260px]" loading="lazy" />
        ) : (
          <div className="grid h-[260px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-[#4a4a4a] px-6 py-4 text-white max-[640px]:px-4">
        <span className="inline-flex h-11 w-[72px] items-center justify-center rounded-sm bg-[#d71920] text-lg font-extrabold italic leading-none">MW</span>
        <strong className="min-w-0 flex-1 truncate text-center text-[22px] font-bold max-[640px]:text-[18px]">
          {selectedModelCard.modelName} {leafView.wattage || ''}
        </strong>
        <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold">1/2</span>
      </div>
    </div>
  )
}

function ProductInfoPanel({ view, actions, routePayload }) {
  const selectedModelName = view.selectedOptionModel || view.selectedModelCard.modelName

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
          {view.activeMajor?.name} / {view.activeSubcategory}
        </p>
        {!view.isShopSite ? (
          <button type="button" className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#d53232] px-4 text-xs font-bold text-white shadow-[0_10px_20px_rgba(213,50,50,0.18)] transition hover:bg-[#bd2929]" onClick={actions.onOpenStoreProductPreset}>
            온라인샵에서 구매하기
          </button>
        ) : null}
      </div>
      <h4 className="m-0 mt-3 text-[22px] font-bold leading-snug text-slate-950 max-[640px]:mt-2 max-[640px]:text-[17px]">
        민웰 SMPS {selectedModelName} {view.leafView.wattage || ''} 파워서플라이
      </h4>
      {view.isShopSite ? (
        <p className="m-0 mt-4 text-[30px] font-extrabold leading-none text-[#d6001c] max-[640px]:mt-3 max-[640px]:text-[25px]">
          {formatProductPriceText(selectedModelName, view.inventoryContext, { aggregate: !view.selectedOptionModel })}
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 border-y border-slate-200 py-5 text-[15px] text-slate-700 max-[640px]:mt-4 max-[640px]:gap-2.5 max-[640px]:py-4 max-[640px]:text-[14px]">
        {view.isShopSite ? (
          <>
            <p className="m-0 flex justify-between gap-4"><strong className="text-slate-500">배송</strong><span className="text-right font-bold">경동 6,000원(영업소 기입) / 로젠 3,000원</span></p>
            <p className="m-0 flex justify-between gap-4"><strong className="text-slate-500">재고</strong><span className="text-right font-bold">{formatInventoryText(selectedModelName, view.inventoryContext, { aggregate: !view.selectedOptionModel })}</span></p>
          </>
        ) : null}
        <p className="m-0 flex justify-between gap-4"><strong className="text-slate-500">출력</strong><span className="text-right font-bold">{view.leafView.wattage || '정보 없음'}</span></p>
      </div>

      <div className="mt-5">
        <ProductOptionPanel
          isModelSelected
          isShopSite={view.isShopSite}
          selectedCombinedOptionModels={view.selectedCombinedOptionModels}
          selectedOptionModel={view.selectedOptionModel}
          selectedModelCard={view.selectedModelCard}
          selectedQuoteQuantity={view.selectedQuoteQuantity}
          inventoryContext={view.inventoryContext}
          routePayload={routePayload}
          setSelectedOptionModel={actions.setSelectedOptionModel}
          setSelectedQuoteQuantity={actions.setSelectedQuoteQuantity}
          markHistoryReplace={actions.markHistoryReplace}
          onStartGuestOrder={actions.onStartGuestOrder}
          onAddLineItem={actions.onAddLineItem}
          onScrollToPdfSection={actions.onScrollToPdfSection}
        />
      </div>
      {!view.isShopSite ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <FeatureList features={view.leafView.features} itemKey="detail-side-feature" />
        </div>
      ) : null}
    </>
  )
}
