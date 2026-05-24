import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ukyulwragmpdzmwbtitg.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_pkCg6b51B5aPXzAYiYGBWw_lKAOe5WJ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
