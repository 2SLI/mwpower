import { normalizeLabel } from '../../productCatalogService'
import { decodeAssetUrl } from '../productViewUtils'
import { FeatureList, LeafRecordCard } from './LeafRecordCard'
import { ModelActionList } from './ModelActionList'
import { ProductDetailCard } from './ProductDetailCard'
import { ProductOptionPanel } from './ProductOptionPanel'

export function ProductResults({ view, actions, refs }) {
  return (
    <div className="category-grid grid gap-3 rounded-[12px] bg-slate-100 p-1">
      {view.hasSearch ? (
        <RecordList records={view.searchLeafRecords} emptyText="검색 결과가 없습니다. 다른 키워드로 다시 시도해보세요." view={view} actions={actions} />
      ) : view.showMajorAggregateView ? (
        <RecordList records={view.majorAllLeafRecords} view={view} actions={actions} />
      ) : !view.activeLeaf ? (
        <NoLeafSelected view={view} />
      ) : view.selectedModelCard && view.leafView ? (
        <ProductDetailCard view={view} actions={actions} refs={refs} />
      ) : view.activeLeaf && view.leafView ? (
        <LeafSummary view={view} actions={actions} />
      ) : (
        <EmptyMessage text="상단 카테고리 바의 모델 선택 메뉴에서 모델을 선택해주세요." />
      )}
    </div>
  )
}

function RecordList({ records = [], emptyText, view, actions }) {
  if (records.length === 0) {
    return <EmptyMessage text={emptyText} compact />
  }

  return (
    <div className="grid gap-3">
      {records.map((record) => (
        <LeafRecordCard
          key={record.key}
          record={record}
          activeModel={view.activeModel}
          isShopSite={view.isShopSite}
          inventoryContext={view.inventoryContext}
          onSelectModel={actions.onLeafRecordModelClick}
        />
      ))}
    </div>
  )
}

function NoLeafSelected({ view }) {
  if (!view.activeSubcategory) {
    return <EmptyMessage text="상단 카테고리 바에서 소분류를 선택하면 시리즈 결과가 표시됩니다." />
  }
  if (view.selectableLeafChips.length === 0) {
    return <EmptyMessage text="선택한 소분류에 등록된 시리즈가 없습니다." />
  }
  return <EmptyMessage text="상단 카테고리 바의 소분류 선택 메뉴에서 시리즈를 선택해주세요." />
}

function LeafSummary({ view, actions }) {
  const routePayload = {
    majorId: view.activeMajorId,
    majorName: view.activeMajor?.name,
    subcategory: view.activeSubcategory,
    leaf: view.activeLeaf,
    groupName: view.selectedGroupName ?? view.activeGroup,
    thumbnailUrl: view.leafView?.thumbnailUrl,
    wattage: view.leafView?.wattage,
  }

  return (
    <article className="rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
        {view.activeMajor?.name} / {view.activeSubcategory} / {view.activeLeaf}
      </p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
        <div className="grid content-start gap-3">
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
            {view.leafView.thumbnailUrl ? (
              <img src={decodeAssetUrl(view.leafView.thumbnailUrl)} alt={view.activeLeaf} className="block h-[220px] w-full object-contain p-3" loading="lazy" />
            ) : (
              <div className="grid h-[220px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
            )}
          </div>

          <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
            <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Model</p>
            <ModelActionList
              items={view.modelCards}
              activeModel={view.activeModel}
              isShopSite={view.isShopSite}
              inventoryContext={view.inventoryContext}
              onSelectModel={(item) => actions.onModelClick(item.modelName)}
            />
          </div>
        </div>

        <div className="grid content-start gap-3">
          <h4 className="m-0 text-[26px] font-bold leading-tight text-slate-900 max-[640px]:text-[22px]">{view.activeLeaf}</h4>
          <div className="grid gap-1.5 text-[15px] text-slate-700">
            <p className="m-0"><strong>Wattage:</strong> {view.leafView.wattage || '정보 없음'}</p>
          </div>
          <FeatureList features={view.leafView.features} itemKey={normalizeLabel(view.activeLeaf)} />
        </div>

        <ProductOptionPanel
          isModelSelected={false}
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
    </article>
  )
}

function EmptyMessage({ text, compact = false }) {
  const className = compact
    ? 'rounded-xl border border-dashed border-slate-300 bg-white px-[18px] py-6'
    : 'rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6'

  return (
    <div className={className}>
      <p className="m-0 text-center text-sm text-slate-500">{text}</p>
    </div>
  )
}
