// ─── SUPABASE CLIENT ───
// Clave publicable (anon key): protegida por Row Level Security en las tablas.
// NUNCA poner aca la service_role key.
var SUPABASE_URL = 'https://iafjpoeznbdotfwtepdw.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_d3IvhW0gPGd1MUNKWxp41g_b8VkEQYG';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
