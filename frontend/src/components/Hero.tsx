'use client'

/**
 * HeroBanner
 * 
 * Renders the main hero banner section at the top with:
 * - Welcome title
 * - Short description
 * - Call-to-Action (CTA) buttons
 */
export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold mb-4">Bem-vindo ao Scarf Store</h2>
        <p className="text-xl opacity-90 mb-8">
          Descubra nossa coleção premium de lenços e acessórios
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-accent transition">
            Comprar Agora
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition">
            Saiba Mais
          </button>
        </div>
      </div>
    </section>
  )
}
