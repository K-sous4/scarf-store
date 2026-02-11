import { MainNavigation, HeroBanner, ProductGrid, PageFooter } from '@/components'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function HomeContent() {
  return (
    <div className="flex flex-col min-h-screen bg-amber-100">
      <MainNavigation />
      <main className="flex-1 bg-amber-100">
        <HeroBanner />
        
        {/* Products Section */}
        <section id="products" className="bg-amber-100 w-full">
          <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossa Coleção</h2>
            <p className="text-gray-600 text-lg">
              Explore nossa coleção curada de lenços e acessórios premium
            </p>
          </div>
          <ProductGrid />
        </div>
        </section>
      </main>
      
      <PageFooter />
    </div>
  )
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}
