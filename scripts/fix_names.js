const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Fixing missing full_names in enrollments...");

    // 1. Get all enrollments where full_name is null but they are claimed
    const { data: enrolls } = await supabase
        .from('enrollments')
        .select('id, linked_user_id')
        .is('full_name', null)
        .not('linked_user_id', 'is', null);

    if (!enrolls || enrolls.length === 0) {
        console.log("No enrollments need fixing, or failed to fetch.");
        return;
    }

    // 2. Lookup profiles
    const userIds = enrolls.map(e => e.linked_user_id);
    const { data: profiles } = await supabase
        .from('arivolam_profiles')
        .select('id, display_name')
        .in('id', userIds);

    const profileMap = {};
    if (profiles) {
        profiles.forEach(p => profileMap[p.id] = p.display_name);
    }

    // 3. Update enrollments
    let updated = 0;
    for (const enr of enrolls) {
        const name = profileMap[enr.linked_user_id];
        if (name) {
            await supabase.from('enrollments').update({ full_name: name }).eq('id', enr.id);
            updated++;
        }
    }

    console.log(`Updated ${updated} enrollments with full_name.`);
}

main();
