export const NEWS_FALLBACK_IMAGE = '/logo/mwpower_logo.png'

export const newsArticles = [
  {
    id: 'meanwell-official-skm-dkm-w8-20260505',
    date: '2026-05-05',
    title: 'SKM/DKM W8 Series: 10W~30W 1"x 1" 8:1 Ultra-Wide Input Isolated and Regulated DC-DC Converter',
    summary: '민웰 공식 New Products 소식입니다. 1"x1" 패키지의 8:1 초광범위 입력 DC-DC 컨버터 라인업으로, 10W/15W/20W/30W 전력 구간을 제공합니다.',
    image: NEWS_FALLBACK_IMAGE,
    thumbnail: NEWS_FALLBACK_IMAGE,
    articleUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1498',
    externalUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1498',
    sourceLabel: 'MEAN WELL 공식',
    source: 'meanwell-official',
    isPublished: true,
  },
  {
    id: 'meanwell-official-powernex-dgbsc-20260429',
    date: '2026-04-29',
    title: 'PowerNex | DGBSC-SG01/4, DGBSC-SG02/4 Series: Splicing Connector',
    summary: '민웰 공식 New Products 소식입니다. 공구 없이 빠르게 배선할 수 있는 레버 방식 스플라이싱 커넥터 제품군입니다.',
    image: NEWS_FALLBACK_IMAGE,
    thumbnail: NEWS_FALLBACK_IMAGE,
    articleUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1508',
    externalUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1508',
    sourceLabel: 'MEAN WELL 공식',
    source: 'meanwell-official',
    isPublished: true,
  },
  {
    id: 'meanwell-official-car01-20260427',
    date: '2026-04-27',
    title: 'CAR01 Series: 1W SMD Package DC-DC Unregulated Isolated DC-DC Converter',
    summary: '민웰 공식 New Products 소식입니다. 소형 SMD 패키지 기반의 1W 절연형 DC-DC 컨버터 제품입니다.',
    image: NEWS_FALLBACK_IMAGE,
    thumbnail: NEWS_FALLBACK_IMAGE,
    articleUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1501',
    externalUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1501',
    sourceLabel: 'MEAN WELL 공식',
    source: 'meanwell-official',
    isPublished: true,
  },
  {
    id: 'meanwell-official-es-hsi-20260421',
    date: '2026-04-21',
    title: 'ES-HSI Series: 6kW & 12kW Single/Three Phrase Energy Storage Inverters',
    summary: '민웰 공식 New Products 소식입니다. 에너지 저장 시스템용 6kW 및 12kW 인버터 라인업입니다.',
    image: NEWS_FALLBACK_IMAGE,
    thumbnail: NEWS_FALLBACK_IMAGE,
    articleUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1500',
    externalUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1500',
    sourceLabel: 'MEAN WELL 공식',
    source: 'meanwell-official',
    isPublished: true,
  },
  {
    id: 'meanwell-official-xdr-20260306',
    date: '2026-03-06',
    title: 'XDR Series: 75W~960W Next Generation 1O Input Ultra-Slim Premium Flagship DIN Rail Power Supply',
    summary: '민웰 공식 New Products 소식입니다. 75W~960W 구간의 차세대 초슬림 DIN Rail 전원공급기 XDR 시리즈입니다.',
    image: NEWS_FALLBACK_IMAGE,
    thumbnail: NEWS_FALLBACK_IMAGE,
    articleUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1490',
    externalUrl: 'https://www.meanwell.com/newsInfo.aspx?c=1&i=1490',
    sourceLabel: 'MEAN WELL 공식',
    source: 'meanwell-official',
    isPublished: true,
  },
]

function toTimestamp(dateText) {
  return new Date(`${dateText}T00:00:00+09:00`).getTime()
}

export function getAllNewsSorted() {
  return [...newsArticles].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
}

export function getNewsById(articleId) {
  return newsArticles.find((article) => article.id === articleId) ?? null
}

export function formatNewsDate(dateText) {
  return String(dateText ?? '').replaceAll('-', '.')
}
