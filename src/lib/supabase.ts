import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ytfbkcxqbfhxsuqtmmme.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZmJrY3hxYmZoeHN1cXRtbW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTg4MzIsImV4cCI6MjA5NTI5NDgzMn0.oxVrDu8-bTvF9CVskpm0_EUY98L7cWkeIWuJqH6Lbj0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
