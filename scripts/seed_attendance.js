const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Seeding attendance...");

    // 1. Get all student enrollments for SAFI
    const { data: stData } = await supabase.from('enrollments').select('id').eq('role', 'student');
    if (!stData || stData.length === 0) return console.log("No students found.");

    // 2. Get timetable entries for Monday (day 1)
    const { data: ttData } = await supabase.from('timetable_entries').select('id').eq('day_of_week', 1);
    if (!ttData || ttData.length === 0) return console.log("No timetable entries for Monday.");

    // 3. Get nearest past Monday
    const lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7);
    const dstr = lastMonday.toISOString().split('T')[0];

    let insertedCount = 0;

    for (const tt of ttData) {
        const attInserts = stData.map(s => ({
            student_enrollment_id: s.id,
            timetable_entry_id: tt.id,
            date: dstr,
            status: Math.random() > 0.1 ? 'present' : 'absent'
        }));

        // Batch insert using upsert to avoid duplicate key errors
        const { data, error } = await supabase.from('attendance').upsert(attInserts.slice(0, 50), { onConflict: 'student_enrollment_id, timetable_entry_id, date' });
        if (error) console.error("Upsert error 1:", error.message);
        else insertedCount += attInserts.slice(0, 50).length;

        if (attInserts.length > 50) {
            const { data: d2, error: err2 } = await supabase.from('attendance').upsert(attInserts.slice(50), { onConflict: 'student_enrollment_id, timetable_entry_id, date' });
            if (err2) console.error("Upsert error 2:", err2.message);
            else insertedCount += attInserts.slice(50).length;
        }
    }

    console.log(`Finished seeding attendance. Upserted ${insertedCount} records for date ${dstr}.`);
}

main();
