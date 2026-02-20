import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Arivolam",
    description: "How Arivolam collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-sm dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="lead text-muted-foreground">Last updated: February 2026</p>

            <h2>1. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>
                When you create an account, we collect your name, email address, and optionally your
                phone number. If you sign in via social providers (Google, GitHub, etc.), we receive
                basic profile information from those services.
            </p>

            <h3>Profile Information</h3>
            <p>
                You may choose to provide additional information such as a username, display name,
                headline, bio, avatar, education history, and skills. This information is visible to
                other users based on your privacy settings.
            </p>

            <h3>Usage Data</h3>
            <p>
                We collect information about how you use the Platform, including pages visited,
                features used, and interaction patterns to improve the user experience.
            </p>

            <h2>2. How We Use Your Information</h2>
            <ul>
                <li>To provide and maintain the Platform</li>
                <li>To personalize your experience and show relevant content</li>
                <li>To communicate with you about updates, features, and support</li>
                <li>To ensure security and prevent abuse</li>
                <li>To improve our services through analytics</li>
            </ul>

            <h2>3. Data Sharing</h2>
            <p>
                We do not sell your personal information. We may share data with:
            </p>
            <ul>
                <li><strong>Service Providers:</strong> Third-party services that help us operate the Platform (e.g., hosting, analytics)</li>
                <li><strong>Institutions:</strong> If you are a member of an institution, your basic profile and activity within that institution may be visible to institution administrators</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
                We use industry-standard security measures to protect your data, including encryption
                in transit and at rest. We use Supabase for authentication and data storage, which
                provides enterprise-grade security.
            </p>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Control your profile visibility (public/private)</li>
                <li>Export your data</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>
                We use essential cookies for authentication and session management. We do not use
                third-party tracking cookies.
            </p>

            <h2>7. Children&apos;s Privacy</h2>
            <p>
                The Platform is not intended for children under 13. We do not knowingly collect
                personal information from children.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
                We may update this policy from time to time. We will notify you of significant
                changes via email or platform notifications.
            </p>

            <h2>9. Contact</h2>
            <p>
                For privacy-related questions, contact us at{" "}
                <a href="mailto:hello@arivolam.com">hello@arivolam.com</a>.
            </p>
        </article>
    );
}
