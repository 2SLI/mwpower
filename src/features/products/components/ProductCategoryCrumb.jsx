import { normalizeLabel } from '../../productCatalogService'
import { hasPdfAsset } from '../productViewUtils'

export function ProductCategoryCrumb({ view, refs, actions }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="w-full">
        <div className="product-category-crumb" ref={refs.categoryCrumbRef}>
          <DesktopCrumb view={view} actions={actions} />
          <MobileCrumb view={view} actions={actions} />
        </div>
      </div>
    </div>
  )
}

function DesktopCrumb({ view, actions }) {
  return (
    <div className="inner max-[640px]:hidden">
      <CrumbPanel id="aside-g-panel" type="g" isOpen={view.isMajorPanelOpen} label={view.activeMajor?.name ?? '상품'} onToggle={actions.toggleMajorPanel}>
        {view.majorCategories.map((item) => (
          <button key={item.id} type="button" className={item.id === view.activeMajor?.id ? 'on' : ''} onClick={() => actions.onMajorClick(item.id)}>
            {item.name}
          </button>
        ))}
      </CrumbPanel>

      <CrumbPanel id="aside-s-panel" type="s" isOpen={view.isSubPanelOpen} label={view.activeSubcategory ?? '중분류 선택'} onToggle={actions.toggleSubPanel} disabled={view.subcategories.length === 0}>
        {view.subcategories.map((subcategory) => (
          <button key={subcategory} type="button" className={normalizeLabel(subcategory) === normalizeLabel(view.activeSubcategory) ? 'on' : ''} onClick={() => actions.onSubcategoryClick(subcategory)}>
            {subcategory}
          </button>
        ))}
      </CrumbPanel>

      <CrumbPanel id="aside-l-panel" type="l" isOpen={view.isLeafPanelOpen} label={view.activeLeaf ?? '소분류 선택'} onToggle={actions.toggleLeafPanel} disabled={view.selectableLeafChips.length === 0}>
        {view.selectableLeafChips.map((leafChip) => (
          <button key={leafChip} type="button" className={normalizeLabel(leafChip) === normalizeLabel(view.activeLeaf) ? 'on' : ''} onClick={() => actions.onLeafClick(leafChip)}>
            {leafChip}
          </button>
        ))}
      </CrumbPanel>

      <CrumbPanel id="aside-m-panel" type="m" isOpen={view.isModelPanelOpen} label={view.activeModel ?? '모델 선택'} onToggle={actions.toggleModelPanel} disabled={view.modelCards.length === 0}>
        {view.modelCards.map((item) => (
          <button key={item.modelName} type="button" className={normalizeLabel(item.modelName) === normalizeLabel(view.activeModel) ? 'on' : ''} onClick={() => actions.onModelClick(item.modelName)}>
            {item.modelName}
            {!hasPdfAsset(item.asset) ? ' · PDF 준비중' : ''}
          </button>
        ))}
      </CrumbPanel>
    </div>
  )
}

function CrumbPanel({ id, type, isOpen, label, onToggle, disabled = false, children }) {
  return (
    <dl className={`${type} ${isOpen ? 'open' : ''}`}>
      <dt>
        <button type="button" aria-expanded={isOpen} aria-controls={id} onClick={onToggle} disabled={disabled}>{label}</button>
      </dt>
      <dd id={id} aria-hidden={!isOpen}>
        <div>{children}</div>
      </dd>
    </dl>
  )
}

function MobileCrumb({ view, actions }) {
  return (
    <div className="mobile-crumb hidden max-[640px]:block">
      <div className="mobile-tab-bar" role="tablist" aria-label="카테고리 선택 탭">
        <button type="button" className={`mobile-tab ${view.isMajorPanelOpen ? 'on' : ''}`} aria-expanded={view.isMajorPanelOpen} aria-controls="mobile-major-panel" onClick={actions.toggleMajorPanel}>
          <span className="mobile-tab-text">{view.activeMajor?.name ?? '상품'}</span>
        </button>
        <button type="button" className={`mobile-tab ${view.isSubPanelOpen ? 'on' : ''}`} aria-expanded={view.isSubPanelOpen} aria-controls="mobile-sub-panel" onClick={actions.toggleSubPanel} disabled={view.subcategories.length === 0}>
          <span className="mobile-tab-text">{view.activeSubcategory ?? '중분류 선택'}</span>
        </button>
      </div>

      {view.isMajorPanelOpen ? (
        <div className="mobile-tab-panel" id="mobile-major-panel">
          {view.majorCategories.map((item) => (
            <button key={item.id} type="button" className={item.id === view.activeMajor?.id ? 'on' : ''} onClick={() => actions.onMajorClick(item.id)}>
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      {view.isSubPanelOpen ? (
        <div className="mobile-tab-panel" id="mobile-sub-panel">
          {view.subcategories.map((subcategory) => (
            <button key={subcategory} type="button" className={normalizeLabel(subcategory) === normalizeLabel(view.activeSubcategory) ? 'on' : ''} onClick={() => actions.onSubcategoryClick(subcategory)}>
              {subcategory}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
