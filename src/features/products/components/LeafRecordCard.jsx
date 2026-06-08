import { decodeAssetUrl } from '../productViewUtils'
import { ModelActionList } from './ModelActionList'

export function LeafRecordCard({
  record,
  activeModel,
  isShopSite,
  inventoryContext,
  onSelectModel,
}) {
  return (
    <article className="rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
        {record.major} / {record.subcategory} / {record.leaf}
      </p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
          {record.thumbnailUrl ? (
            <img
              src={decodeAssetUrl(record.thumbnailUrl)}
              alt={record.leaf}
              className="block h-[220px] w-full object-contain p-3"
              loading="lazy"
            />
          ) : (
            <div className="grid h-[220px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
          )}
        </div>

        <div className="grid content-start gap-3">
          <h4 className="m-0 text-[26px] font-bold leading-tight text-slate-900 max-[640px]:text-[22px]">{record.leaf}</h4>
          <div className="grid gap-1.5 text-[15px] text-slate-700">
            <p className="m-0">
              <strong>Wattage:</strong> {record.wattage || '정보 없음'}
            </p>
          </div>

          <FeatureList features={record.features} itemKey={record.key} />
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
          <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Model</p>
          <ModelActionList
            items={record.modelList}
            activeModel={activeModel}
            isShopSite={isShopSite}
            inventoryContext={inventoryContext}
            onSelectModel={(item) => onSelectModel?.(record, item.modelName)}
          />
        </div>
      </div>
    </article>
  )
}

export function FeatureList({ features = [], itemKey = 'feature' }) {
  return (
    <div>
      <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Features</p>
      {Array.isArray(features) && features.length > 0 ? (
        <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-6 text-slate-700">
          {features.map((feature) => (
            <li key={`${itemKey}-${feature}`}>{feature}</li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[14px] text-slate-500">등록된 feature 정보가 없습니다.</p>
      )}
    </div>
  )
}
