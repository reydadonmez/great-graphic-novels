import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ukyulwragmpdzmwbtitg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreXVsd3JhZ21wZHptd2J0aXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTczNDQsImV4cCI6MjA5NTE5MzM0NH0.GlpAGv7ctImsCvCPYI0PGaGJAQ238pHpitGei11H4Cg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
