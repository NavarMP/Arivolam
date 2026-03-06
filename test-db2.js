const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: st } = await supabase.from('enrollments').select('id').eq('role', 'student');
    const { data: tt } = await supabase.from('timetable_entries').select('id, day_of_week').eq('day_of_week', 1);

    if (tt.length > 0 && st.length > 0) {
        let lastMonday = new Date();
        lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7);
        const dstr = lastMonday.toISOString().split('T')[0];

        console.log("Seeding for", dstr);

        for (const t of tt) {
            const attInserts = st.map(s => ({
                student_enrollment_id: s.id,
                timetable_entry_id: t.id,
                date: dstr,
                status: Math.random() > 0.1 ? 'present' : 'absent'
            }));
            const { error: err1 } = await supabase.from('attendance').insert(attInserts.slice(0, 50));
            if (err1) console.error("Err1:", err1);
            if (attInserts.length > 50) {
                const { error: err2 } = await supabase.from('attendance').insert(attInserts.slice(50));
                if (err2) console.error("Err2:", err2);
            }
        }
    }
}
check();
