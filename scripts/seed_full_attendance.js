const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Seeding Full Timetable & 30 Days Attendance...");

    // 1. Get class ID for "BCA 3rd Yr"
    const { data: cls } = await supabase.from('classes').select('id').eq('name', 'BCA 3rd Yr').single();
    if (!cls) return console.log("Class not found.");
    const classId = cls.id;

    // 2. Get students
    const { data: students } = await supabase.from('student_classes').select('enrollment_id').eq('class_id', classId);
    if (!students || students.length === 0) return console.log("No students found.");

    // 3. Get faculty subjects and periods
    const { data: fsData } = await supabase.from('faculty_subjects').select('id, subject_id').eq('class_id', classId);
    const { data: periods } = await supabase.from('periods').select('id').order('sort_order');

    if (!fsData || fsData.length < 4 || !periods || periods.length < 4) {
        return console.log("Missing subjects or periods.", fsData?.length, periods?.length);
    }

    // Prepare Timetable missing days (2-5: Tue-Fri)
    for (let day = 2; day <= 5; day++) {
        // Just shift the subjects each day so they are in a different order
        for (let pIdx = 0; pIdx < 4; pIdx++) {
            const subjectIdx = (day + pIdx) % 4; // rotate
            const fs = fsData[subjectIdx];
            const p = periods[pIdx];

            // Check if exists
            const { data: existing } = await supabase.from('timetable_entries')
                .select('id').eq('class_id', classId).eq('period_id', p.id).eq('day_of_week', day).single();

            if (!existing) {
                await supabase.from('timetable_entries').insert({
                    class_id: classId,
                    subject_id: fs.subject_id,
                    faculty_subject_id: fs.id,
                    period_id: p.id,
                    day_of_week: day,
                    room: `Room ${100 + day}`
                });
            }
        }
    }
    console.log("Filled timetable for Mon-Fri.");

    // 4. Get all timetable entries
    const { data: allTt } = await supabase.from('timetable_entries').select('id, day_of_week').eq('class_id', classId);

    // 5. Generate 30 days of attendance
    let totalUpserts = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay(); // 0-6
        const dstr = d.toISOString().split('T')[0];

        // Find timetable entries for this day
        const dayEntries = allTt.filter(t => t.day_of_week === dayOfWeek);

        if (dayEntries.length > 0) {
            for (const tt of dayEntries) {
                const attInserts = students.map(s => {
                    const rnd = Math.random();
                    // 85% present, 5% absent, 5% late, 5% leave/od
                    let status = "present";
                    if (rnd > 0.95) status = "absent";
                    else if (rnd > 0.90) status = "late";
                    else if (rnd > 0.85) status = "leave";

                    return {
                        student_enrollment_id: s.enrollment_id,
                        timetable_entry_id: tt.id,
                        date: dstr,
                        status: status
                    };
                });

                // Upsert
                const { error: err1 } = await supabase.from('attendance')
                    .upsert(attInserts.slice(0, 50), { onConflict: 'student_enrollment_id, timetable_entry_id, date' });
                if (err1) console.log("err1", err1.message);

                if (attInserts.length > 50) {
                    const { error: err2 } = await supabase.from('attendance')
                        .upsert(attInserts.slice(50), { onConflict: 'student_enrollment_id, timetable_entry_id, date' });
                    if (err2) console.log("err2", err2.message);
                }

                totalUpserts += attInserts.length;
            }
        }
    }

    console.log(`Generated 30 days of varied attendance. Total ${totalUpserts} records upserted!`);
}

main();
