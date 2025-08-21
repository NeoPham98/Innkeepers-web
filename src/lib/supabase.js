import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cemimfmpumzuxyvqobvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbWltZm1wdW16dXh5dnFvYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzM3MTMsImV4cCI6MjA1NDkwOTcxM30.I_FcP_3ZOkud4xcgDRpcak8I5oGvsTiCZFrpcOWAlpE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
  db: { schema: 'public' },
});


