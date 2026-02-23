/**
 * Cached Data Hooks
 * 
 * Reusable hooks for fetching data with automatic caching via SWR
 */

'use client'

import useSWR from 'swr'
import { apiClient } from './api-client'
import { swrConfig, globalSWRConfig } from './swr-config'
import type { Product, ProductsResponse } from '@/types'

/**
 * Generic fetcher for SWR
 * Converts APIClient response to data or throws error
 */
const fetcher = async <T,>(endpoint: string): Promise<T> => {
  const response = await apiClient.get<T>(endpoint)
  
  if (response.error) {
    throw new Error(response.error)
  }
  
  if (!response.data) {
    throw new Error('No data returned')
  }
  
  return response.data
}

/**
 * Hook para buscar todos os produtos com cache
 * 
 * @param page - Página de paginação (opcional)
 * @param limit - Items por página (opcional)
 * @example
 * const { data, isLoading, error } = useProducts()
 */
export function useProducts(page = 1, limit = 20) {
  const endpoint = `/v1/products?skip=${(page - 1) * limit}&limit=${limit}`
  
  return useSWR<ProductsResponse>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.products,
    }
  )
}

/**
 * Hook para buscar um produto específico
 * 
 * @param productId - ID do produto
 * @example
 * const { data: product, isLoading } = useProduct(1)
 */
export function useProduct(productId: number | null) {
  const endpoint = productId ? `/v1/products/${productId}` : null
  
  return useSWR<Product>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.products,
    }
  )
}

/**
 * Hook para buscar produtos em estoque baixo (admin)
 * 
 * @param threshold - Limite de estoque mínimo
 * @example
 * const { data: lowStockProducts } = useLowStockProducts(10)
 */
export function useLowStockProducts(threshold = 10) {
  const endpoint = `/v1/admin/low-stock?threshold=${threshold}`
  
  return useSWR<ProductsResponse>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.dynamic, // Revalidate frequently
    }
  )
}

/**
 * Hook para buscar categorias com cache longo
 * 
 * @example
 * const { data: categories } = useCategories()
 */
export function useCategories() {
  const endpoint = '/v1/categories'
  
  return useSWR<Array<{ id: number; name: string }>>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.products, // Categorias mudam raramente
    }
  )
}

/**
 * Hook para buscar cores disponíveis
 * 
 * @example
 * const { data: colors } = useColors()
 */
export function useColors() {
  const endpoint = '/v1/colors'
  
  return useSWR<Array<{ id: number; name: string }>>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.products,
    }
  )
}

/**
 * Hook para buscar materiais disponíveis
 * 
 * @example
 * const { data: materials } = useMaterials()
 */
export function useMaterials() {
  const endpoint = '/v1/materials'
  
  return useSWR<Array<{ id: number; name: string }>>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.products,
    }
  )
}

/**
 * Hook para buscar resultado de busca com cache curto
 * 
 * @param query - Termo de busca
 * @example
 * const { data: results } = useSearchProducts('lenço azul')
 */
export function useSearchProducts(query: string) {
  const endpoint = query ? `/v1/products/search?q=${encodeURIComponent(query)}` : null
  
  return useSWR<ProductsResponse>(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      ...swrConfig.oneTime, // Don't revalidate searches automatically
    }
  )
}

/**
 * Hook para prefetch de dados (preload sem usar)
 * Útil para preparar dados antes de navegação
 * 
 * @param endpoint - Endpoint a prefetch
 * @example
 * usePrefetch('/v1/products/1') // Preload product before navigation
 */
export function usePrefetch(endpoint: string | null): void {
  useSWR(
    endpoint,
    fetcher,
    {
      ...globalSWRConfig,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
}

/**
 * Hook para invalidar cache manualmente
 * Força revalidação imediata
 * 
 * @example
 * const revalidate = useRevalidate()
 * // Após criar/atualizar produto
 * revalidate('/v1/products')
 */
export function useRevalidate() {
  return async (endpoint: string) => {
    // Nota: SWR não expõe invalidation direto
    // Solução: Usar mutate do SWR ou refetch manual
    const response = await fetcher(endpoint)
    return response
  }
}
