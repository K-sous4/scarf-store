import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
      {/* Scarf illustration */}
      <div className="mb-8 select-none" aria-hidden="true">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Knot centre */}
          <ellipse cx="80" cy="80" rx="22" ry="18" fill="#d6d3d1" />
          <ellipse cx="80" cy="80" rx="14" ry="10" fill="#a8a29e" />

          {/* Left tail */}
          <path
            d="M58 78 C40 72 18 88 12 108 C8 122 16 138 28 140 C40 142 50 130 48 118 C46 106 34 100 38 90 C42 80 56 82 58 82"
            fill="#e7e5e4"
            stroke="#d6d3d1"
            strokeWidth="1.5"
          />
          {/* Left tail stripe */}
          <path
            d="M44 84 C36 90 28 104 30 118"
            stroke="#c7c0ba"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 5"
          />

          {/* Right tail */}
          <path
            d="M102 78 C120 72 142 88 148 108 C152 122 144 138 132 140 C120 142 110 130 112 118 C114 106 126 100 122 90 C118 80 104 82 102 82"
            fill="#e7e5e4"
            stroke="#d6d3d1"
            strokeWidth="1.5"
          />
          {/* Right tail stripe */}
          <path
            d="M116 84 C124 90 132 104 130 118"
            stroke="#c7c0ba"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 5"
          />

          {/* Knot detail lines */}
          <path
            d="M68 76 Q80 70 92 76"
            stroke="#9c9490"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M66 80 Q80 74 94 80"
            stroke="#9c9490"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M68 84 Q80 90 92 84"
            stroke="#9c9490"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* 404 number */}
      <p className="text-7xl font-bold tracking-tight text-stone-700 leading-none">
        404
      </p>

      {/* Heading */}
      <h1 className="mt-4 text-2xl font-semibold text-stone-800">
        Página não encontrada
      </h1>

      {/* Description */}
      <p className="mt-3 text-stone-500 max-w-sm leading-relaxed">
        Parece que este lenço se perdeu no armário.
        <br />A página que procura não existe ou foi movida.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Voltar ao início
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  )
}
