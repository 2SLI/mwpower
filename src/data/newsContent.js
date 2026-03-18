export const NEWS_ALL_CATEGORY = '전체보기'

export const newsCategories = [NEWS_ALL_CATEGORY, 'SDG Industry News', '신제품 출시', '제품 공지', '기술 노트']

export const newsArticles = [
  {
    id: 'tech-bic5k-grid-20260318',
    category: '기술 노트',
    date: '2026-03-18',
    title: 'BIC-5K 양방향 전원 적용 시 그리드 연계 안정화 체크리스트',
    summary: '실증 프로젝트에서 자주 나오는 계통 연계 이슈를 기준으로 보호, 통신, 모드 전환 항목을 정리했습니다.',
    author: 'Technical Service Center / Willard Wu',
    email: 'willard@meanwell.com',
    image: '/meanwell/news/bic-5k-applications.jpg',
    imageCaption: 'Figure 1. Applications of Bidirectional Power Supplies',
    paragraphs: [
      '재생에너지 비중이 커질수록 부하 변동과 전력 품질 이슈를 동시에 대응해야 합니다. 특히 양방향 전원 시스템은 충전/방전 전환 타이밍과 보호 로직의 정합성이 현장 안정성에 직접적인 영향을 줍니다.',
      'BIC-5K 기반 구성에서는 운전 모드 전환 조건, 외부 신호 연동, 통신 파라미터를 프로젝트 초기에 고정하는 것이 중요합니다. 이 단계에서 인터페이스를 정리해 두면 시운전 기간을 크게 줄일 수 있습니다.',
    ],
    bullets: ['Ultra-Fast Switching', 'High Efficiency', 'High-Voltage Support', 'Flexible Expansion', 'Smart Communication', 'Enhanced Safety'],
    articleUrl:
      'https://www.meanwell.com/document/BIC-5K%20%E9%9B%99%E5%90%91%E9%9B%BB%E6%BA%90%E4%B9%8B%E6%87%89%E7%94%A8_en.pdf',
  },
  {
    id: 'new-elg-lineup-20260312',
    category: '신제품 출시',
    date: '2026-03-12',
    title: 'ELG Series 고내구 LED Driver 신규 라인업 입고 안내',
    summary: '옥외 조명 프로젝트 대응을 위해 ELG 라인업의 전력 구간을 확장해 공급을 시작했습니다.',
    author: 'Product Team / MEANWELL POWER',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index-solutions-pic1.jpg',
    imageCaption: 'ELG Series for LED applications',
    paragraphs: [
      '신규 입고 라인업은 방진/방수 환경에서의 신뢰성을 중심으로 구성되었습니다. 장시간 운전 현장 기준으로 발열 관리와 설치 편의성을 고려해 모델 선택 폭을 넓혔습니다.',
      '기존 프로젝트의 대체 모델 문의가 많은 구간을 우선 반영했고, 샘플 테스트 및 적용 문의는 제품문의 메뉴에서 바로 접수할 수 있습니다.',
    ],
  },
  {
    id: 'product-rcp-pdf-20260308',
    category: '제품 공지',
    date: '2026-03-08',
    title: 'RCP Series 기술자료(PDF) 3종 업데이트',
    summary: 'RCP 제품군 적용 검토를 위한 주요 기술자료 3종을 최신 개정본으로 교체했습니다.',
    author: 'Quality Documents Team',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index-solutions-pic3.jpg',
    imageCaption: 'RCP configurable power documents',
    paragraphs: [
      '업데이트된 자료에는 전기적 특성, 보호 기능, 통신 설정 항목이 추가되었습니다. 기존 문서 대비 시스템 적용 시 필요한 의사결정 포인트를 더 빠르게 확인할 수 있습니다.',
      '현장 적용 전에는 최신 문서 기준으로 정격 및 주변 조건을 다시 확인해 주세요. 프로젝트 제출용 문서가 필요하면 별도 요청이 가능합니다.',
    ],
  },
  {
    id: 'sdg-factory-efficiency-20260304',
    category: 'SDG Industry News',
    date: '2026-03-04',
    title: '산업 현장 탄소 저감을 위한 고효율 전원 전환 사례',
    summary: '공장 자동화 라인에서 대기전력과 발열 손실을 줄인 전원 교체 사례를 공유합니다.',
    author: 'Industry Solution Desk',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index_1.jpg',
    imageCaption: 'Factory power efficiency case',
    paragraphs: [
      '다수의 현장에서 기존 전원을 고효율 모델로 교체한 뒤 냉각 비용과 유지보수 시간을 동시에 절감한 사례가 확인되고 있습니다.',
      'SDG 관점에서는 단순 효율 수치뿐 아니라 실제 운영 비용과 수명주기 관리를 함께 보는 접근이 필요합니다.',
    ],
  },
  {
    id: 'new-ddr-compact-20260226',
    category: '신제품 출시',
    date: '2026-02-26',
    title: 'DDR Series 컴팩트형 모델 추가 및 납기 안내',
    summary: '제어반 내부 공간 제약이 큰 장비를 위해 DDR 시리즈 컴팩트 모델을 추가했습니다.',
    author: 'Product Team / MEANWELL POWER',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index_1.jpg',
    imageCaption: 'DDR compact models',
    paragraphs: [
      '신규 모델은 협소한 패널 설치 환경을 고려해 폼팩터를 최적화했습니다. 출력 안정성과 기본 보호 기능은 기존 라인업 기준을 그대로 유지합니다.',
      '프로젝트 양산 일정이 있는 경우 사전 수량 예약으로 납기 리스크를 줄일 수 있습니다.',
    ],
  },
  {
    id: 'notice-lrs-transition-20260221',
    category: '제품 공지',
    date: '2026-02-21',
    title: 'LRS 일부 모델 전환 일정 및 대체 모델 매핑 공지',
    summary: '기존 사용 모델의 전환 일정과 호환 가능한 대체 모델 리스트를 안내드립니다.',
    author: 'Product Lifecycle Team',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index-solutions-pic4.jpg',
    imageCaption: 'LRS transition guide',
    paragraphs: [
      '단종 예정 모델은 프로젝트 영향도를 고려해 순차적으로 전환됩니다. 기존 설계에서 변경이 필요한 항목은 핀맵, 설치 규격, 보호 동작 순서입니다.',
      '대체 모델 매핑표는 현장 적용성 검토를 위해 주기적으로 업데이트되며, 특수 사양은 별도 기술문의가 필요합니다.',
    ],
  },
  {
    id: 'tech-rsp-thermal-20260214',
    category: '기술 노트',
    date: '2026-02-14',
    title: 'RSP Series 고출력 구간 열설계 가이드',
    summary: '고출력 구간에서 자주 발생하는 열 누적 문제를 줄이기 위한 기본 배치 기준을 정리했습니다.',
    author: 'Technical Service Center',
    email: 'hclee@l-light.co.kr',
    image: '/meanwell/index-solutions-pic6.jpg',
    imageCaption: 'RSP thermal design notes',
    paragraphs: [
      'RSP 고출력 운전 시에는 주변 온도와 공기 흐름, 부하 패턴을 함께 고려해야 합니다. 데이터시트 단일 조건만으로는 장기 운전 품질을 보장하기 어렵습니다.',
      '사전 검증 단계에서 온도 마진을 확보하면 현장 재작업과 다운타임을 줄일 수 있습니다.',
    ],
  },
]

function toTimestamp(dateText) {
  return new Date(`${dateText}T00:00:00+09:00`).getTime()
}

export function getAllNewsSorted() {
  return [...newsArticles].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
}

export function getNewsByCategory(category) {
  const all = getAllNewsSorted()
  if (!category || category === NEWS_ALL_CATEGORY) return all
  return all.filter((article) => article.category === category)
}

export function getNewsById(articleId) {
  return newsArticles.find((article) => article.id === articleId) ?? null
}

export function formatNewsDate(dateText) {
  return String(dateText ?? '').replaceAll('-', '/')
}
