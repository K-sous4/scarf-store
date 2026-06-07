export interface ViaCepResult {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchViaCep(postalCode: string): Promise<ViaCepResult | null> {
  const digits = postalCode.replace(/\D/g, "")
  if (digits.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!response.ok) return null
    const data = (await response.json()) as ViaCepResult
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
