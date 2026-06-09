import { solutionCards } from '../homeData'

export function DesktopSolutionGrid({ onNavigateSolution }) {
  return (
    <section className="grid w-full grid-cols-6 max-[1280px]:grid-cols-3 max-[980px]:grid-cols-3 max-[640px]:hidden">
      {solutionCards.map((item) => (
        <a
          href="#"
          key={item.title}
          className="relative block min-h-[252px] overflow-hidden border-r border-slate-300 bg-white transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d13d3d] max-[640px]:min-h-[224px] max-[480px]:border-r-0 max-[480px]:border-t max-[480px]:border-slate-300"
          onClick={(event) => {
            event.preventDefault()
            onNavigateSolution(item)
          }}
        >
          <img className="block h-48 w-full object-cover max-[640px]:h-40" src={item.image} alt={item.alt} />
          <h3 className="m-0 min-h-[70px] px-4 pt-4 text-center text-[clamp(13px,0.84vw,17px)] leading-[1.35] text-neutral-700">{item.title}</h3>
        </a>
      ))}
    </section>
  )
}
