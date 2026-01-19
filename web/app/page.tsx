import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        {/* Radial gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
              S
            </span>
            <span className="text-lg font-bold">StageZoeker</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link 
              href="/stages" 
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Stages zoeken
            </Link>
            <Link 
              href="/stages" 
              className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Beginnen
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Duizenden stages van Stagemarkt & NVB
          </div>
          
          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Vind je perfecte
            <br />
            <span className="text-gradient">stage</span> in Nederland
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Doorzoek stages van MBO tot WO, filter op locatie en niveau, 
            en vind direct de perfecte stageplek voor jouw carrière.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/stages"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Start met zoeken
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/5">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-zinc-500">Stages</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">2</div>
              <div className="text-sm text-zinc-500">Bronnen</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">12</div>
              <div className="text-sm text-zinc-500">Provincies</div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Feature highlights */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Slim zoeken</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Zoek op functie, bedrijf, stad of vaardigheid. Onze slimme zoekfunctie vindt precies wat je zoekt.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Filteren op niveau</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Van MBO 1 tot WO - filter direct op jouw opleidingsniveau en vind relevante stages.
            </p>
          </div>
          
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Zoek in je buurt</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Filter op provincie of stad en vind stages dicht bij huis of juist in een andere regio.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
