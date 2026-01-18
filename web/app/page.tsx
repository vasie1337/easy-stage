import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-lg font-semibold">StageZoeker</span>
          <nav className="flex items-center gap-8 text-sm text-zinc-400">
            <Link href="/stages" className="hover:text-white transition-colors">Stages</Link>
            <a href="#" className="hover:text-white transition-colors">Over</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Vind je perfecte stage
          </h1>
          <Link
            href="/stages"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 font-semibold rounded-full hover:bg-zinc-200 transition-colors"
          >
            Zoek stages
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Subtle gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
