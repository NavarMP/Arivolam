const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    // 1. Get a student
    const { data: st } = await supabase.from('enrollments').select('id, email, is_approved').eq('email', 'student01@safi.edu.in').single();
    console.log("Student:", st);

    if (st) {
        // 2. Check attendance
        const { data: att } = await supabase.from('attendance').select('*').eq('student_enrollment_id', st.id);
        console.log("Attendance count:", att ? att.length : 0);
        if (att && att.length > 0) {
            console.log("First attendance record:", att[0]);
        }
    }
}
check();
