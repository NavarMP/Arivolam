const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data: st } = await supabase.from('student_classes').select(`
        id, roll_number,
        student:enrollments!student_classes_enrollment_id_fkey(id, full_name, register_number, admission_number)
    `).limit(2);
    console.log("Students from query:", JSON.stringify(st, null, 2));
}
check();
