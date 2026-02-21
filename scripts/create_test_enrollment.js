const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load env vars
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Creating test enrollment...");

    // 1. Get SIAS institution ID
    const { data: sias, error: instError } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', 'sias')
        .single();

    if (instError) {
        console.error("Institution error:", instError);
        process.exit(1);
    }
    console.log("SIAS ID:", sias.id);

    // 2. Hash password
    const rawPassword = "SecurePassword123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);
    console.log("Generated hash for password.");

    // 3. Insert Enrollment
    const { data: enrollment, error } = await supabase
        .from('enrollments')
        .insert({
            institution_id: sias.id,
            role: 'student',
            admission_number: 'TESTBCA001',
            username: 'testbca001',
            password_hash: hash,
            is_claimed: false
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating enrollment:", error);
    } else {
        console.log("Success! Enrollment Created:", enrollment.id);
        console.log("Credentials to test:");
        console.log("Institution: SIAS");
        console.log("Identifier: TESTBCA001 (or testbca001)");
        console.log("Password: SecurePassword123!");
    }
}

main();
