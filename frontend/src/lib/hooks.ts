/**
 * Custom React Hooks for API Requests
 * 
 * Provides hooks for common API operations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient, APIResponse } from './api-client'

/**
 * useFetch
 * 
 * Hook for fetching data from the API
 * Automatically handles loading, error, and data states
 */
export function useFetch<T>(
  endpoint: string,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<T>(endpoint)

      if (isMounted) {
        if (response.error) {
          setError(response.error)
        } else {
          setData(response.data || null)
        }
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [endpoint, ...dependencies])

  return { data, loading, error }
}

/**
 * useMutation
 * 
 * Hook for POST, PUT, DELETE requests
 * Provides manual control over request execution
 */
export function useMutation<T>(
  method: 'POST' | 'PUT' | 'DELETE'
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const execute = useCallback(
    async (endpoint: string, body?: unknown): Promise<APIResponse<T>> => {
      setLoading(true)
      setError(null)
      setSuccess(false)

      try {
        let response: APIResponse<T>

        if (method === 'POST') {
          response = await apiClient.post<T>(endpoint, body)
        } else if (method === 'PUT') {
          response = await apiClient.put<T>(endpoint, body)
        } else {
          response = await apiClient.delete<T>(endpoint)
        }

        if (response.error) {
          setError(response.error)
        } else {
          setSuccess(true)
        }

        setLoading(false)
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setLoading(false)
        return {
          error: errorMessage,
          status: 0,
        }
      }
    },
    [method]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
  }, [])

  return { loading, error, success, execute, reset }
}

/**
 * useProducts
 * 
 * Hook for fetching products list
 */
interface Product {
  id: number
  sku: string
  name: string
  short_description?: string
  price: number
  discount_percentage: number
  discount_price?: number
  stock: number
  color?: string
  images?: string[]
  is_featured?: boolean
}

interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export function useProducts(skip: number = 0, limit: number = 50) {
  // Use admin endpoint for fetching products (protected route)
  // Middleware will intercept /api/* and proxy to backend
  const endpoint = `/v1/admin/products?skip=${skip}&limit=${limit}`
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await apiClient.get<ProductsResponse>(endpoint)

    if (response.error) {
      setError(response.error)
    } else {
      setData(response.data || null)
    }
    setLoading(false)
  }, [endpoint])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    products: data?.products || [],
    total: data?.total || 0,
    loading,
    error,
    refetch,
  }
}

/**
 * useProduct
 * 
 * Hook for fetching a single product by ID
 */
export function useProduct(productId: number) {
  const endpoint = `/api/v1/products/${productId}`
  return useFetch<Product>(endpoint, [productId])
}

/**
 * useProductMutation
 * 
 * Hook for creating/updating/deleting products (admin only)
 */
export function useProductMutation(method: 'POST' | 'PUT' | 'DELETE') {
  return useMutation<Product>(method)
}
