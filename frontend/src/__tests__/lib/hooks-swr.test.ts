/**
 * SWR Hooks Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import {
  useProducts,
  useProduct,
  useLowStockProducts,
  useCategories,
  useColors,
  useMaterials,
  useSearchProducts,
  usePrefetch,
  useRevalidate,
} from '@/lib/hooks-swr'

// Mock swr
vi.mock('swr', () => ({
  default: vi.fn(),
}))

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch products', async () => {
    const mockData = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should handle loading state', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProducts())

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch')

    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProducts())

    expect(result.current.error).toEqual(error)
  })
})

describe('useProduct', () => {
  it('should fetch single product', async () => {
    const mockProduct = {
      id: 1,
      name: 'Product 1',
      price: 100,
      description: 'A product',
    }

    vi.mocked(useSWR).mockReturnValue({
      data: mockProduct,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProduct(1))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProduct)
    })
  })

  it('should not fetch when id is missing', () => {
    const { result } = renderHook(() => useProduct(null as any))

    expect(result.current.data).toBeUndefined()
  })
})

describe('useLowStockProducts', () => {
  it('should fetch low stock products', async () => {
    const mockData = [
      { id: '1', name: 'Product 1', stock: 5 },
      { id: '2', name: 'Product 2', stock: 2 },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useLowStockProducts(10))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })

  it('should use correct threshold', async () => {
    const threshold = 20

    vi.mocked(useSWR).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    renderHook(() => useLowStockProducts(threshold))

    expect(useSWR).toHaveBeenCalledWith(
      expect.objectContaining({
        threshold,
      }),
      expect.any(Function)
    )
  })
})

describe('useCategories', () => {
  it('should fetch categories', async () => {
    const mockData = [
      { id: '1', name: 'Electronics' },
      { id: '2', name: 'Clothing' },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })
})

describe('useColors', () => {
  it('should fetch colors', async () => {
    const mockData = [
      { id: '1', name: 'Red', hex: '#FF0000' },
      { id: '2', name: 'Blue', hex: '#0000FF' },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useColors())

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })
})

describe('useMaterials', () => {
  it('should fetch materials', async () => {
    const mockData = [
      { id: '1', name: 'Cotton' },
      { id: '2', name: 'Polyester' },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useMaterials())

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })
})

describe('useSearchProducts', () => {
  it('should search products with query', async () => {
    const mockData = [
      { id: '1', name: 'Scarves' },
    ]

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => useSearchProducts('scarf'))

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })

  it('should not fetch with empty query', () => {
    const { result } = renderHook(() => useSearchProducts(''))

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function))
  })

  it('should not fetch with very short query', () => {
    const { result } = renderHook(() => useSearchProducts('a'))

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function))
  })
})

describe('usePrefetch', () => {
  it('should prefetch data', async () => {
    const mockData = { id: '1', name: 'Product' }

    vi.mocked(useSWR).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    const { result } = renderHook(() => usePrefetch('/api/products/1'))

    expect(result.current).toBe(mockData)
  })

  it('should use oneTime cache config', async () => {
    vi.mocked(useSWR).mockReturnValue({
      data: {},
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any)

    renderHook(() => usePrefetch('/api/data'))

    expect(useSWR).toHaveBeenCalledWith(
      '/api/data',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    )
  })
})

describe('useRevalidate', () => {
  it('should return revalidation function', async () => {
    const mockFn = async () => ({})

    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockFn,
    } as any)

    const { result } = renderHook(() => useRevalidate())

    expect(result.current).toBeDefined()
    expect(typeof result.current).toBe('function')
  })
})
