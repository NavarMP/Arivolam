import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Arivolam",
    description: "Terms and conditions for using the Arivolam platform.",
};

export default function TermsPage() {
    return (
        <article className="prose prose-sm dark:prose-invert max-w-none">
            <h1>Terms of Service</h1>
            <p className="lead text-muted-foreground">Last updated: February 2026</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using Arivolam (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you may not use the Platform.
            </p>

            <h2>2. Description of Service</h2>
            <p>
                Arivolam is a social campus platform that provides educational institutions with tools for
                social networking, campus management, and community engagement. The Platform includes features
                such as feeds, profiles, institution management, and communication tools.
            </p>

            <h2>3. Account Registration</h2>
            <p>
                To access certain features, you must create an account. You agree to provide accurate, current,
                and complete information during registration and keep your account information updated.
                You are responsible for maintaining the confidentiality of your password and account.
            </p>

            <h2>4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
                <li>Post content that is offensive, defamatory, or violates any law</li>
                <li>Impersonate any person or entity</li>
                <li>Use the Platform for spam, phishing, or malicious purposes</li>
                <li>Attempt to gain unauthorized access to other accounts or systems</li>
                <li>Upload malware or disruptive code</li>
                <li>Violate any applicable local, national, or international laws</li>
            </ul>

            <h2>5. Content Ownership</h2>
            <p>
                You retain ownership of content you post on the Platform. By posting content, you grant
                Arivolam a non-exclusive, worldwide, royalty-free license to use, display, and distribute
                your content within the Platform.
            </p>

            <h2>6. Institution Data</h2>
            <p>
                Institutions using the Platform maintain ownership of their institutional data. Arivolam
                provides tools to manage this data but does not claim ownership over it.
            </p>

            <h2>7. Privacy</h2>
            <p>
                Your use of the Platform is also governed by our{" "}
                <a href="/legal/privacy">Privacy Policy</a>, which describes how we collect, use, and
                protect your personal information.
            </p>

            <h2>8. Termination</h2>
            <p>
                We reserve the right to suspend or terminate accounts that violate these terms.
                You may delete your account at any time through your profile settings.
            </p>

            <h2>9. Disclaimer</h2>
            <p>
                The Platform is provided &quot;as is&quot; without warranties of any kind. Arivolam does not
                guarantee uninterrupted access or error-free operation.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
                We may update these terms from time to time. Continued use of the Platform after
                changes constitutes acceptance of the updated terms. We will notify users of
                significant changes via email or platform notifications.
            </p>

            <h2>11. Contact</h2>
            <p>
                For questions about these Terms, please contact us at{" "}
                <a href="mailto:hello@arivolam.com">hello@arivolam.com</a>.
            </p>
        </article>
    );
}
