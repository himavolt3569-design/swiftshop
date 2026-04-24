import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqhpwurdmdyxqjxfaunl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaHB3dXJkbWR5eHFqeGZhdW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY4MTk2MCwiZXhwIjoyMDkwMjU3OTYwfQ.WWeEXMPZ1eco51ylGkFDDbp_z8baMc0ESYjhm4O5TRQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(1)
  console.log(data, error)
}
run()
