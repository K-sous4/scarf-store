'use client'

/**
 * PageFooter
 * 
 * Renders the page footer with:
 * - Quick links
 * - Contact information
 * - Copyright notice
 */
export default function PageFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Scarf Store</h4>
            <p className="text-sm">Lenços e acessórios premium para todas as estações.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-semibold mb-4">Links Rápidos</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Início</a></li>
              <li><a href="#" className="hover:text-white transition">Produtos</a></li>
              <li><a href="#" className="hover:text-white transition">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-white transition">Contato</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-white font-semibold mb-4">Atendimento</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition">Envios</a></li>
              <li><a href="#" className="hover:text-white transition">Trocas</a></li>
              <li><a href="#" className="hover:text-white transition">Política de Privacidade</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-white font-semibold mb-4">Contato</h5>
            <p className="text-sm mb-2">Email: contato@scarfstore.com</p>
            <p className="text-sm mb-2">Telefone: +55 (11) 9999-9999</p>
            <p className="text-sm">Horário: Seg-Sex 9am-6pm BRT</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
          <p>&copy; 2024 Scarf Store. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
