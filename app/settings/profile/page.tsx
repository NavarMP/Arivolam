"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { PersonalProfileSettings } from "./personal-profile-settings";
import { InstitutionProfileSettings } from "./institution-profile-settings";

export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [institutionDetails, setInstitutionDetails] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            const { data } = await supabase
                .from('arivolam_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
                if (data.profile_type === 'institution') {
                    const { data: instData } = await supabase
                        .from('institution_profile_details')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    if (instData) {
                        setInstitutionDetails(instData);
                    }
                }
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (profile?.profile_type === 'institution') {
        return <InstitutionProfileSettings profile={profile} institutionDetails={institutionDetails} />;
    }

    return <PersonalProfileSettings profile={profile} />;
}
