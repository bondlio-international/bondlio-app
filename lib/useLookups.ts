import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type LookupItem = {
  id: number
  name: string
}

type LookupItemWithColor = {
  id: number
  name: string
  color?: string
}

type CurrencyItem = {
  id: number
  code: string
  name: string
  symbol: string
}

type Lookups = {
  countries: LookupItem[]
  cities: LookupItem[]
  sources: LookupItem[]
  nationalities: LookupItem[]
  services: LookupItem[]
  categories: LookupItem[]
  currencies: CurrencyItem[]
  availability: LookupItemWithColor[]
  legalStatus: LookupItem[]
  workTypes: LookupItem[]
  religions: LookupItem[]
  languages: LookupItem[]
  accounts: LookupItem[]
  requestStages: LookupItemWithColor[]
  matchStages: LookupItemWithColor[]
  departureReasons: LookupItem[]
  matchStatus: LookupItemWithColor[]
  responsibilities: LookupItem[]
}

export function useLookups() {
  const supabase = createClient()
  const [lookups, setLookups] = useState<Lookups>({
    countries: [],
    cities: [],
    sources: [],
    nationalities: [],
    services: [],
    categories: [],
    currencies: [],
    availability: [],
    legalStatus: [],
    workTypes: [],
    religions: [],
    languages: [],
    accounts: [],
    requestStages: [],
    matchStages: [],
    departureReasons: [],
    matchStatus: [],
    responsibilities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLookups = async () => {
      const [
        { data: countries },
        { data: cities },
        { data: sources },
        { data: nationalities },
        { data: services },
        { data: categories },
        { data: currencies },
        { data: availability },
        { data: legalStatus },
        { data: workTypes },
        { data: religions },
        { data: languages },
        { data: accounts },
        { data: requestStages },
        { data: matchStages },
        { data: departureReasons },
        { data: matchStatus },
        { data: responsibilities },
      ] = await Promise.all([
        supabase.from('lookup_countries').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_cities').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_sources').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_nationalities').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_services').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_categories').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_currencies').select('id, code, name, symbol').eq('active', true).order('sort_order'),
        supabase.from('lookup_availability').select('id, name, color').eq('active', true).order('sort_order'),
        supabase.from('lookup_legal_status').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_work_types').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_religions').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_languages').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_accounts').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_request_stages').select('id, name, color').eq('active', true).order('sort_order'),
        supabase.from('lookup_match_stages').select('id, name, color').eq('active', true).order('sort_order'),
        supabase.from('lookup_departure_reasons').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('lookup_match_status').select('id, name, color').eq('active', true).order('sort_order'),
        supabase.from('lookup_responsibilities').select('id, name, name_en').eq('active', true).order('sort_order'),
      ])

      setLookups({
        countries: countries ?? [],
        cities: cities ?? [],
        sources: sources ?? [],
        nationalities: nationalities ?? [],
        services: services ?? [],
        categories: categories ?? [],
        currencies: currencies ?? [],
        availability: availability ?? [],
        legalStatus: legalStatus ?? [],
        workTypes: workTypes ?? [],
        religions: religions ?? [],
        languages: languages ?? [],
        accounts: accounts ?? [],
        requestStages: requestStages ?? [],
        matchStages: matchStages ?? [],
        departureReasons: departureReasons ?? [],
        matchStatus: matchStatus ?? [],
        responsibilities: responsibilities ?? [],
      })
      setLoading(false)
    }

    fetchLookups()
  }, [])

  return { lookups, loading }
}