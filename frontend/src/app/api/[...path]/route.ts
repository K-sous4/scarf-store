import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `http://localhost:8000/api/${path}${searchParams ? '?' + searchParams : ''}`

  console.log(`[Route Handler GET] ${url}`)

  const response = await fetch(url, {
    method: 'GET',
    headers: request.headers,
  })

  const body = await response.text()
  const newResponse = new NextResponse(body, {
    status: response.status,
  })

  // Copy headers, using append for Set-Cookie
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      newResponse.headers.append(key, value)
    } else if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
      newResponse.headers.set(key, value)
    }
  })

  return newResponse
}

// Helper function to build headers with cookies
function buildHeadersWithCookies(request: NextRequest): HeadersInit {
  const headers = new Headers(request.headers)
  
  try {
    // Get all cookies from the request
    const allCookies = request.cookies.getAll()
    console.log(`[Route Handler] All cookies received:`, allCookies)
    
    if (allCookies && allCookies.length > 0) {
      const cookieString = allCookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ')
      
      headers.set('Cookie', cookieString)
      console.log(`[Route Handler] Setting Cookie header: ${cookieString}`)
    } else {
      console.log(`[Route Handler] No cookies found in request`)
    }
  } catch (error) {
    console.error(`[Route Handler] Error processing cookies:`, error)
  }
  
  return headers
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const path = (await params).path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `http://localhost:8000/api/${path}${searchParams ? '?' + searchParams : ''}`

    console.log(`[Route Handler POST] ${url}`)

    const body = await request.text()
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeadersWithCookies(request),
      body: body || undefined,
      credentials: 'include',
    })

    console.log(`[Route Handler POST] Response headers from backend:`, response.headers)
    console.log(`[Route Handler POST] Set-Cookie header:`, response.headers.get('set-cookie'))

    const responseBody = await response.text()
    const newResponse = new NextResponse(responseBody, {
      status: response.status,
    })

    response.headers.forEach((value, key) => {
      console.log(`[Route Handler POST] Forwarding header: ${key} = ${value}`)
      if (key.toLowerCase() === 'set-cookie') {
        newResponse.headers.append(key, value)
      } else if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value)
      }
    })

    return newResponse
  } catch (error) {
    console.error(`[Route Handler POST] Error:`, error)
    return new NextResponse(JSON.stringify({ error: `Route handler error: ${error}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const path = (await params).path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `http://localhost:8000/api/${path}${searchParams ? '?' + searchParams : ''}`

    console.log(`[Route Handler PUT] ${url}`)

    const body = await request.text()
    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeadersWithCookies(request),
      body: body || undefined,
      credentials: 'include',
    })

    const responseBody = await response.text()
    const newResponse = new NextResponse(responseBody, {
      status: response.status,
    })

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        newResponse.headers.append(key, value)
      } else if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value)
      }
    })

    return newResponse
  } catch (error) {
    console.error(`[Route Handler PUT] Error:`, error)
    return new NextResponse(JSON.stringify({ error: `Route handler error: ${error}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const path = (await params).path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `http://localhost:8000/api/${path}${searchParams ? '?' + searchParams : ''}`

    console.log(`[Route Handler DELETE] ${url}`)

    const body = await request.text()
    const headers = buildHeadersWithCookies(request)
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: headers,
      body: body || undefined,
      credentials: 'include',
    })

    console.log(`[Route Handler DELETE] Backend response status:`, response.status)

    const responseBody = await response.text()
    const newResponse = new NextResponse(responseBody, {
      status: response.status,
    })

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        newResponse.headers.append(key, value)
      } else if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value)
      }
    })

    return newResponse
  } catch (error) {
    console.error(`[Route Handler DELETE] Error:`, error)
    return new NextResponse(JSON.stringify({ error: `Route handler error: ${error}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
