const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log("Clearing all attendance...");
    
    // Quickest way to clear is to get IDs and delete, or just delete all if RLS bypass works with no eq
    // Supabase requires at least one filter on delete, so we do neq null
    const { error } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.error("Error clearing attendance:", error);
    } else {
        console.log("Successfully cleared attendance records.");
    }
}
main();
