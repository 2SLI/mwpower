import { BankAccountBox } from './BankAccountBox'

export function OrderPaymentGuide({ children = '주문 접수 후 위 계좌로 정확한 금액을 입금해주세요. 입금 확인 후 상품 준비가 시작됩니다.', accountVariant = 'compact' }) {
  return (
    <>
      <BankAccountBox variant={accountVariant} />
      <p className="m-0 mt-4 rounded-xl bg-[#fff7e6] px-4 py-3 text-sm font-bold leading-6 text-[#8a5a00]">
        {children}
      </p>
    </>
  )
}
