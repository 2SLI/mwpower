export const NEWS_CATEGORIES = ['신제품', '기술자료', '단종모델']

const VALID_NEWS_CATEGORIES = new Set(NEWS_CATEGORIES)

const LEGACY_CATEGORY_MAP = {
  '기술 자료': '기술자료',
  '산업 뉴스': '기술자료',
  '제품 공지': '신제품',
  전시회: '기술자료',
  '회사 소식': '기술자료',
  보도자료: '기술자료',
  '영상 채널': '기술자료',
}

export function normalizeNewsCategory(value = '') {
  const text = String(value ?? '').trim()
  if (LEGACY_CATEGORY_MAP[text]) return LEGACY_CATEGORY_MAP[text]
  return VALID_NEWS_CATEGORIES.has(text) ? text : ''
}

export function inferNewsCategory(article = {}) {
  const explicitCategory = normalizeNewsCategory(article.category)
  if (explicitCategory) return explicitCategory

  const haystack = `${article.title ?? ''} ${article.originalTitle ?? ''} ${article.summary ?? ''}`.toLowerCase()

  if (/단종|종료|폐지|구형|대체|전환|사용 중이라면|차세대|discontinu|obsolete|eol|end[\s-]?of[\s-]?life|replacement|replace|phase[\s-]?out/.test(haystack)) {
    return '단종모델'
  }

  if (/ske|ska|skm|dke|dka|dkm/.test(haystack)) return '신제품'

  if (/신제품|출시|신규|라인업 확대|new product|new|launch|released|series:|시리즈:|powernex|커넥터|connector|accessory/.test(haystack)) {
    return '신제품'
  }

  if (/기술|자료|사용법|사용 이유|선정|가이드|application|solution|webinar|웨비나|영상|동영상|유튜브|youtube|전시|전시회|expo|exhibition|show|fair|booth|보도|press|media|release|회사|기업|esg|지속가능|sustainability|수상|award|창립|사옥|에너지 저장|energy storage|인버터|inverter|ess|solar|태양광|산업|industrial|automation|aec|절연|isolated|unregulated|regulated|smd|초광범위|ultra-wide|converter|컨버터/.test(haystack)) {
    return '기술자료'
  }

  if (/series|시리즈|신제품|new product|new/.test(haystack)) return '신제품'

  return '기술자료'
}
