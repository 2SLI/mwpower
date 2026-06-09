export const solutionCards = [
  { title: 'DC/DC Converter 전원 솔루션', image: '/meanwell/dcdcconverter_banner.jpeg', alt: 'DC/DC', productPreset: { majorId: 'dc-dc' } },
  { title: '친환경 전원 솔루션', image: '/meanwell/green-power-solution-banner.png', alt: 'Green Power', productSearch: 'LED' },
  { title: '의료 전원 솔루션', image: '/meanwell/index-solutions-pic6.jpg', alt: 'MEDICAL', productSearch: 'MEDICAL' },
  {
    title: 'LED Display 솔루션',
    image: '/meanwell/led-display-solution-banner.jpg',
    alt: 'Display',
    productSearch: 'UHP-200(R), UHP-350(R), UHP-500(R), UHP-200A, NEL-400, HSP-200, HSP-300, RSP-200, RSP-320, LRS-200, LRS-350',
  },
  {
    title: '시스템 전원 솔루션',
    image: '/meanwell/index-solutions-pic3.jpg',
    alt: 'System Power',
    productSearch: 'NMP Series, UMP Series, RCP Series, NCP Series, CMU2 Series, DRP Series',
  },
  {
    title: '건물 관리 솔루션',
    image: '/meanwell/index-solutions-pic5.jpg',
    alt: 'Building Management',
    productSearch: 'KNX, HDR, LCM, PWM, XLC, KAA, DLC, KSI, KSR, KSC',
  },
]

export const productCards = [
  { name: 'DC/DC Converter Power Solutions', type: 'DDR Series', desc: '고효율 DC/DC 전원 구성으로 제어반과 산업 장비의 안정적인 전압 변환을 지원합니다.' },
  { name: 'Green Power Solution', type: 'ELG Series', desc: '친환경 전원 환경에 최적화된 정전류/정전압 전원으로 장기 운용 안정성을 확보합니다.' },
  { name: 'Medical Power Solution', type: 'RSP Series', desc: '의료 및 정밀 장비 적용을 위한 고신뢰 전원 라인업으로 시스템 가동 리스크를 줄입니다.' },
  { name: 'LED Display Solution', type: 'LRS Series', desc: '디스플레이 구동 환경에 맞춘 표준형 전원 구성을 통해 설치와 유지보수를 단순화합니다.' },
]

export const popularSearches = ['LRS-350', 'XDR-240', 'NDR-240', 'MDR-60', 'HDR-60', 'RS-25']

export const storeCategoryCards = [
  { label: 'AC/DC', image: '/catalog/meanwell/thumbnails/lrs.png', preset: { majorId: 'ac-dc' } },
  { label: 'DIN Rail', image: '/catalog/meanwell/thumbnails/xdr.png', preset: { majorId: 'ac-dc', subcategory: 'DIN Rail' } },
  { label: 'DC/DC', image: '/meanwell/dcdcconverter_banner.jpeg', preset: { majorId: 'dc-dc' } },
  { label: 'LED Driver', image: '/meanwell/green-power-solution-banner.png', search: 'LED' },
  { label: 'Medical', image: '/meanwell/index-solutions-pic6.jpg', search: 'MEDICAL' },
  { label: 'Accessory', image: '/catalog/meanwell/thumbnails/drp.jpg', preset: { majorId: 'peripheral' } },
]
