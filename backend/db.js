require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔄 db.js loading...');
console.log('SUPABASE_URL exists?', !!process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists?', !!process.env.SUPABASE_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔄 Creating Supabase client...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('✅ Supabase client created successfully!');

module.exports = supabase;