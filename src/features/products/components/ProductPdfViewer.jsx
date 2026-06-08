import { Document, Page } from 'react-pdf'
import { withPdfViewerParams } from '../productViewUtils'

export function ProductPdfViewer({
  selectedModelCard,
  selectedPdfUrl,
  isMobileViewport,
  mobilePdfViewportRef,
  mobilePdfNumPages,
  mobilePdfPageWidth,
  onMobileLoadSuccess,
  onMobileLoadError,
  pdfSectionRef,
}) {
  if (!selectedModelCard?.asset?.pdfUrl) {
    return (
      <div ref={pdfSectionRef} className="scroll-mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8">
        <p className="m-0 text-center text-sm text-slate-500">PDF 준비중입니다.</p>
      </div>
    )
  }

  return (
    <div ref={pdfSectionRef} className="pdf-viewer-shell scroll-mt-4 h-[1290px] rounded-lg border border-slate-300 bg-[#1f2937] max-[980px]:h-[1050px] max-[640px]:h-[calc(100dvh-170px)] max-[640px]:min-h-[560px]">
      {isMobileViewport ? (
        <div ref={mobilePdfViewportRef} className="pdf-react-viewer h-full w-full">
          <Document
            key={selectedPdfUrl}
            file={selectedPdfUrl}
            loading={<p className="m-0 px-2 py-4 text-center text-sm text-slate-600">PDF 불러오는 중...</p>}
            onLoadSuccess={onMobileLoadSuccess}
            onLoadError={onMobileLoadError}
            error={<p className="m-0 px-2 py-4 text-center text-sm text-rose-600">PDF 표시 중 오류가 발생했습니다.</p>}
            noData={<p className="m-0 px-2 py-4 text-center text-sm text-slate-600">PDF 파일이 없습니다.</p>}
          >
            {mobilePdfNumPages > 0 &&
              Array.from({ length: mobilePdfNumPages }, (_, pageIndex) => (
                <Page
                  key={`mobile-pdf-page-${pageIndex + 1}`}
                  pageNumber={pageIndex + 1}
                  width={mobilePdfPageWidth ?? undefined}
                  renderAnnotationLayer
                  renderTextLayer
                />
              ))}
          </Document>
        </div>
      ) : (
        <iframe
          title={`${selectedModelCard.modelName} PDF`}
          src={withPdfViewerParams(selectedPdfUrl, { mobile: false })}
          className="pdf-viewer-frame h-full w-full border-0 bg-white"
        ></iframe>
      )}
    </div>
  )
}
