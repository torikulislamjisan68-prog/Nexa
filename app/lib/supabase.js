import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wedmrntomqofnpdufxft.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZG1ybnRvbXFvZm5wZHVmeGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MjE3NzAsImV4cCI6MjEwNzk5Nzc3MH0.w8CdxJ6p5VnODiUnnyz0qWzL6jwCmip8-oH2P6SoLK4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)