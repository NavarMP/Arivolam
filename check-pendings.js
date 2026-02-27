const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: insts } = await supabase.from('institutions').select('id, slug');
    const { data: pending } = await supabase
        .from('enrollments')
        .select('*')
        .eq('is_approved', false);
        
    console.log("Pending Enrollments count:", pending?.length);
    if (pending?.length > 0) {
        const instId = pending[0].institution_id;
        const matchingInst = insts.find(i => i.id === instId);
        console.log("Found pending enrollment for institution:", matchingInst ? matchingInst.slug : "UNKNOWN");
        console.log("Pending Enrollment data:", pending[0]);
    }
}

run();
