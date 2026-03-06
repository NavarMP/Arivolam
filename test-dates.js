const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    // get dates from attendance
    const { data: att } = await supabase.from('attendance').select('date, status');

    if (!att) {
        console.log("No attendance found");
        return;
    }

    const dates = {};
    for (const a of att) {
        if (!dates[a.date]) dates[a.date] = { present: 0, absent: 0, late: 0, leave: 0 };
        dates[a.date][a.status]++;
    }

    const sortedDates = Object.keys(dates).sort();
    console.log("Seeded dates and counts:");
    for (const d of sortedDates) {
        console.log(`${d}: P=${dates[d].present}, A=${dates[d].absent}, L=${dates[d].late}, LV=${dates[d].leave}`);
    }
}
check();
