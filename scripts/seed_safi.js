const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers to create names
const firstNames = ["Aarav", "Aditi", "Akhil", "Anjali", "Arjun", "Deepak", "Devika", "Fahad", "Fathima", "Gokul", "Harish", "Karthik", "Kavya", "Malavika", "Meera", "Mohammed", "Neha", "Nikhil", "Nithya", "Pranav", "Rahul", "Reshma", "Riya", "Rohan", "Sachin", "Sajid", "Sara", "Shahina", "Shamil", "Sneha", "Sreejith", "Sruthi", "Vishnu", "Yasin"];
const lastNames = ["Nair", "Menon", "Pillai", "Kurup", "Panicker", "Varghese", "Thomas", "George", "John", "Mathew", "Ali", "Rahman", "Hassan", "Ahamed", "Abdul"];

function getRandomName() {
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${f} ${l}`;
}

async function main() {
    console.log("Starting SAFI Seeder...");

    const outputs = [];

    // 1. Fetch institution "safi"
    const { data: inst, error: instErr } = await supabase
        .from('institutions')
        .select('id, slug')
        .eq('slug', 'safi')
        .single();

    if (instErr || !inst) {
        console.error("Error finding 'safi' institution:", instErr);
        return;
    }
    const instId = inst.id;
    console.log("Found SAFI:", instId);

    // 2. Fetch Department "BCA" / "Department of Computer Applications (DCA)"
    const { data: depts, error: deptErr } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('institution_id', instId);
    
    let bcaDept = depts.find(d => d.name.includes("Computer Applications") || d.code.includes("BCA"));
    if (!bcaDept && depts.length > 0) bcaDept = depts[0];

    if (!bcaDept) {
         console.error("Error: No departments found for SAFI.");
         return;
    }
    const deptId = bcaDept.id;
    console.log("Found Department:", bcaDept.name);

    // 3. Fetch Semester "Semester 6"
    const { data: sems, error: semErr } = await supabase
        .from('semesters')
        .select('id, name')
        .eq('institution_id', instId);
    
    let sem6 = sems.find(s => s.name.includes("6"));
    if (!sem6 && sems.length > 0) sem6 = sems[0];

    if (!sem6) {
         console.error("Error: No semesters found for SAFI.");
         return;
    }
    const semId = sem6.id;
    console.log("Found Semester:", sem6.name);

    // 4. Create or Fetch Class "BCA 3rd Yr"
    let { data: bcaClass, error: clsErr } = await supabase
        .from('classes')
        .select('id, name')
        .eq('department_id', deptId)
        .eq('semester_id', semId)
        .eq('name', 'BCA 3rd Yr')
        .single();
    
    if (!bcaClass) {
        console.log("Creating class BCA 3rd Yr...");
        const res = await supabase.from('classes').insert({
            department_id: deptId,
            semester_id: semId,
            name: 'BCA 3rd Yr',
            section: 'A',
            max_students: 60
        }).select().single();
        bcaClass = res.data;
    }
    const classId = bcaClass.id;
    console.log("Class ID:", classId);

    // 5. Build subjects lookup
    const { data: subjects, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('department_id', deptId);
    
    const subjectMap = {};
    subjects.forEach(s => subjectMap[s.name] = s.id);

    // Ensure we have subjects 
    const osSubjectId = subjectMap['Operating Systems'] || subjectMap['BCA6B12 -Operating Systems'] || subjects.find(s=>s.name.includes('Operating'))?.id;
    const androidSubjectId = subjectMap['Android Programming'] || subjectMap['BCA6B11 -Android Programming'] || subjects.find(s=>s.name.includes('Android'))?.id;
    const networkSubjectId = subjectMap['Computer Networks'] || subjectMap['BCA6B13 -Computer Networks'] || subjects.find(s=>s.name.includes('Network'))?.id;
    const systemSubjectId = subjectMap['System Software'] || subjectMap['BCA6B16A -System Software'] || subjects.find(s=>s.name.includes('System Software'))?.id;

    console.log("Subjects found:", { osSubjectId, androidSubjectId, networkSubjectId, systemSubjectId });

    const passwordStr = "Password@123";
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(passwordStr, salt);

    // Helpers to create users
    async function createUser(email, password, name, role) {
        // Create in auth.users
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name, full_name: name }
        });

        if (authErr) {
            console.error("Auth User Error ("+email+"):", authErr.message);
            // might already exist
            return null;
        }

        // The trigger will create `arivolam_profiles`, `enrollments`, `institution_members` based on existing un-claimed enrollments...
        // But since we are creating users directly, let's create the un-claimed enrollment first, then create the auth user.
        return authUser.user;
    }

    async function createPreEnrollmentThenUser(email, name, role, ident) {
        // 1. Create enrollment
        const { data: enroll, error: enrErr } = await supabase.from('enrollments').insert({
            institution_id: instId,
            email: email,
            register_number: ident,
            admission_number: ident,
            username: email.split('@')[0],
            password_hash: passHash,
            role: role,
            department: bcaDept.name,
            is_claimed: false
        }).select().single();

        if (enrErr) {
            console.error("Enrollment error:", enrErr);
            return null;
        }

        // 2. Create Auth User (this triggers the handle_new_user_profile and links them)
        const user = await createUser(email, passwordStr, name, role);

        // Fetch the updated enrollment to get the correct enrollment ID
        const { data: linkedEnr } = await supabase.from('enrollments').select('id, linked_user_id').eq('email', email).single();

        return { user, enrollment: linkedEnr };
    }

    // --- Create Faculty ---
    const faculties = [
        { name: "Anshid Babu T M", code: "anshid", subjectId: osSubjectId },
        { name: "Rasheeja A P", code: "rasheeja", subjectId: androidSubjectId },
        { name: "Safeena C", code: "safeena", subjectId: networkSubjectId },
        { name: "Raseena V", code: "raseena", subjectId: systemSubjectId }
    ];

    const facultyEnrollmentIds = {};

    console.log("\\n--- Creating Faculty ---");
    outputs.push("### Faculties");
    for (const f of faculties) {
        const email = `${f.code}@safi.edu.in`;
        console.log(`Creating faculty: ${f.name} (${email})`);
        const res = await createPreEnrollmentThenUser(email, f.name, "faculty", `FACULTY-${f.code.toUpperCase()}`);
        if (res) {
            facultyEnrollmentIds[f.code] = res.enrollment.id;
            outputs.push(`- **Name:** ${f.name} | **Email:** ${email} | **Password:** ${passwordStr}`);
            
            // Link to subject
            if (f.subjectId) {
                await supabase.from('faculty_subjects').insert({
                    enrollment_id: res.enrollment.id,
                    subject_id: f.subjectId,
                    class_id: classId
                });
            }
        }
    }

    // --- Create Students ---
    console.log("\\n--- Creating 55 Students ---");
    outputs.push("\\n### Students");
    outputs.push("*(All users below have password: `" + passwordStr + "`)*\\n");
    outputs.push("| Roll No | Name | Email |");
    outputs.push("|---|---|---|");

    const studentEnrollmentIds = [];
    for (let i = 1; i <= 55; i++) {
        const rollStr = i.toString().padStart(2, '0');
        const name = getRandomName();
        const email = `student${rollStr}@safi.edu.in`;
        const ident = `SAFI23BCA${rollStr}`;

        console.log(`Creating student ${i}/55: ${name} (${email})`);
        const res = await createPreEnrollmentThenUser(email, name, "student", ident);
        
        if (res) {
            studentEnrollmentIds.push(res.enrollment.id);
            outputs.push(`| ${rollStr} | ${name} | ${email} |`);

            // Link to class
            await supabase.from('student_classes').insert({
                enrollment_id: res.enrollment.id,
                class_id: classId,
                roll_number: rollStr
            });
        }
    }

    console.log("\\n--- Saving Credentials to output file ---");
    fs.writeFileSync(path.join(__dirname, 'safi_credentials.md'), outputs.join("\\n"));

    // --- Seeding Dummy Attendance (Just a few records) ---
    console.log("\\n--- Seeding Dummy Attendance ---");
    // need some timetable entries first
    
    // Create Periods
    const periods = [];
    for(let i=1; i<=4; i++) {
        const {data:p} = await supabase.from('periods').insert({
            institution_id: instId,
            name: `Period ${i}`,
            start_time: `0${9+i}:00`,
            end_time: `0${9+i}:50`,
            sort_order: i
        }).select().single();
        if(p) periods.push(p);
    }

    // Create Timetable for Monday (Day 1)
    if (periods.length >= 4) {
        const ttEntries = [];
        const ttmaps = [
            { s: osSubjectId, p: periods[0].id, f: facultyEnrollmentIds['anshid'] },
            { s: androidSubjectId, p: periods[1].id, f: facultyEnrollmentIds['rasheeja'] },
            { s: networkSubjectId, p: periods[2].id, f: facultyEnrollmentIds['safeena'] },
            { s: systemSubjectId, p: periods[3].id, f: facultyEnrollmentIds['raseena'] }
        ];

        for(const m of ttmaps) {
            if(m.s && m.f) {
                // get faculty_subject_id
                const {data:fs} = await supabase.from('faculty_subjects').select('id').eq('enrollment_id', m.f).eq('subject_id', m.s).eq('class_id', classId).single();
                if (fs) {
                    const {data:tt} = await supabase.from('timetable_entries').insert({
                        class_id: classId,
                        subject_id: m.s,
                        faculty_subject_id: fs.id,
                        period_id: m.p,
                        day_of_week: 1, // Monday
                        room: 'Lab 1'
                    }).select().single();
                    if(tt) ttEntries.push(tt);
                }
            }
        }

        // Insert Attendance for Last Monday
        if (ttEntries.length > 0) {
            const lastMonday = new Date();
            lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7); // nearest past monday
            const dstr = lastMonday.toISOString().split('T')[0];

            for (const tt of ttEntries) {
                const attInserts = studentEnrollmentIds.map(stId => ({
                    student_enrollment_id: stId,
                    timetable_entry_id: tt.id,
                    date: dstr,
                    status: Math.random() > 0.1 ? 'present' : 'absent'
                }));
                // batch insert max 50 at a time
                await supabase.from('attendance').insert(attInserts.slice(0, 50));
                if (attInserts.length > 50) {
                    await supabase.from('attendance').insert(attInserts.slice(50));
                }
            }
            console.log("Seeded attendance for", dstr);
        }
    }

    // --- Seeding Dummy Marks ---
    console.log("\\n--- Seeding Dummy Marks ---");
    const subjsToExam = [
        { name: 'Operating Systems IA1', id: osSubjectId, f: facultyEnrollmentIds['anshid'] },
        { name: 'Android IA1', id: androidSubjectId, f: facultyEnrollmentIds['rasheeja'] },
        { name: 'Computer Networks IA1', id: networkSubjectId, f: facultyEnrollmentIds['safeena'] },
        { name: 'System Software IA1', id: systemSubjectId, f: facultyEnrollmentIds['raseena'] }
    ];

    for (const sx of subjsToExam) {
        if (!sx.id) continue;
        const { data: exm } = await supabase.from('exams').insert({
            institution_id: instId,
            subject_id: sx.id,
            class_id: classId,
            semester_id: semId,
            exam_type: 'internal',
            name: sx.name,
            max_marks: 50,
            is_published: true
        }).select().single();

        if (exm) {
            const markInserts = studentEnrollmentIds.map(stId => ({
                exam_id: exm.id,
                student_enrollment_id: stId,
                marks_obtained: Math.floor(Math.random() * 30) + 20, // 20-50 marks
                entered_by: sx.f
            }));
            await supabase.from('exam_marks').insert(markInserts.slice(0,50));
            if(markInserts.length > 50){
                await supabase.from('exam_marks').insert(markInserts.slice(50));
            }
        }
    }
    console.log("Seeded exam marks.");

    console.log("\\nDONE. Wrote credentials to scripts/safi_credentials.md");
}

main();
