import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Khali",
  description:
    "How Khali collects, uses, and protects your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <>
      {/* Nav */}
      <nav className="border-b border-[#ddd0b8] bg-[#fdfaf4]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)",
              }}
            >
              <span className="font-playfair text-sm font-bold text-white">
                K
              </span>
            </div>
            <span className="font-playfair text-xl font-bold text-[#1a120b]">
              Khali
            </span>
          </Link>
          <Link
            href="/"
            className="font-dm-sans text-sm text-[#4a3728] hover:text-[#1a120b] transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <p className="font-dm-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#b8882e] mb-3">
            Legal
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-[#1a120b] mb-4">
            Privacy Policy
          </h1>
          <div className="w-16 h-[3px] bg-[#d4a847] mb-4" />
          <p className="font-dm-sans text-sm text-[#8a7060]">
            Last updated: April 2, 2026
          </p>
        </div>

        {/* Content */}
        <article className="prose-khali space-y-10">
          <Section title="1. Introduction">
            <p>
              Welcome to Khali (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;us&rdquo;). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when
              you use our mobile application and website (collectively, the
              &ldquo;Service&rdquo;).
            </p>
            <p>
              By using Khali, you agree to the collection and use of information
              in accordance with this policy. If you do not agree, please
              discontinue use of the Service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h4>Information you provide directly</h4>
            <ul>
              <li>
                <strong>Account information:</strong> name, email address, and
                profile preferences when you create an account.
              </li>
              <li>
                <strong>Feedback and communications:</strong> any messages,
                surveys, or support requests you send us.
              </li>
              <li>
                <strong>Preferences:</strong> news categories, topics of
                interest, and notification settings you configure.
              </li>
            </ul>

            <h4>Information collected automatically</h4>
            <ul>
              <li>
                <strong>Usage data:</strong> articles viewed, videos watched,
                podcasts listened to, swipe behavior, likes, votes, and time
                spent on content.
              </li>
              <li>
                <strong>Device information:</strong> device type, operating
                system, unique device identifiers, and app version.
              </li>
              <li>
                <strong>Log data:</strong> IP address, access times, pages
                viewed, and referring URLs.
              </li>
              <li>
                <strong>Location data:</strong> approximate location based on IP
                address (we do not collect precise GPS data unless you explicitly
                enable it).
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>
                Personalize your news feed based on your interests and behavior.
              </li>
              <li>
                Generate AI-powered summaries, headlines, and content
                recommendations.
              </li>
              <li>
                Deliver the &ldquo;Both Sides&rdquo; feature by understanding
                your content consumption patterns.
              </li>
              <li>
                Improve and optimize the Service, including training our
                recommendation algorithms.
              </li>
              <li>
                Send you notifications about stories, updates, and features you
                may be interested in.
              </li>
              <li>
                Respond to your inquiries and provide customer support.
              </li>
              <li>
                Detect and prevent fraud, abuse, and security issues.
              </li>
            </ul>
          </Section>

          <Section title="4. AI and Personalization">
            <p>
              Khali uses artificial intelligence to personalize your experience.
              Our AI systems analyze your reading patterns, viewing habits, and
              interaction history to curate content specifically for you. This
              includes:
            </p>
            <ul>
              <li>
                Generating fact-based bullet points and summaries tailored to
                your reading level and interests.
              </li>
              <li>
                Balancing political perspectives by identifying your consumption
                patterns and ensuring exposure to multiple viewpoints.
              </li>
              <li>
                Recommending content formats (video, audio, article) based on
                your past preferences.
              </li>
            </ul>
            <p>
              You can reset your personalization profile at any time in your
              account settings.
            </p>
          </Section>

          <Section title="5. Information Sharing">
            <p>
              We do <strong>not</strong> sell your personal information. We may
              share your data in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>Service providers:</strong> trusted third parties who
                assist us in operating the Service (hosting, analytics, customer
                support).
              </li>
              <li>
                <strong>Legal requirements:</strong> when required by law,
                regulation, or legal process.
              </li>
              <li>
                <strong>Business transfers:</strong> in connection with a merger,
                acquisition, or sale of assets.
              </li>
              <li>
                <strong>Aggregated data:</strong> we may share anonymized,
                aggregated data that cannot identify you.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide the Service. You may request
              deletion of your account and associated data at any time by
              contacting us at{" "}
              <a href="mailto:privacy@khali.app">privacy@khali.app</a>.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard technical and organizational
              measures to protect your data, including encryption in transit and
              at rest, access controls, and regular security audits. However, no
              method of transmission over the Internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@khali.app">privacy@khali.app</a>.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Khali is not intended for use by anyone under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If we become aware that we have collected such information, we will
              take steps to delete it promptly.
            </p>
          </Section>

          <Section title="10. Third-Party Links">
            <p>
              The Service may contain links to third-party websites and news
              sources. We are not responsible for the privacy practices of those
              sites. We encourage you to review their privacy policies before
              providing any personal information.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by posting the updated policy within the
              app and updating the &ldquo;Last updated&rdquo; date above. Your
              continued use of the Service after changes constitutes acceptance
              of the revised policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions about this Privacy Policy, please contact
              us:
            </p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:privacy@khali.app">privacy@khali.app</a>
              </li>
              <li>
                Website:{" "}
                <a href="https://khali.app">khali.app</a>
              </li>
            </ul>
          </Section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ddd0b8] bg-[#f0e4c8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-dm-sans text-xs text-[#8a7060]">
            &copy; {new Date().getFullYear()} Khali. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="font-dm-sans text-xs text-[#4a3728] hover:text-[#1a120b] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="font-dm-sans text-xs text-[#4a3728] hover:text-[#1a120b] transition-colors font-semibold"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-playfair text-2xl font-bold text-[#1a120b] mb-4 border-b border-[#ddd0b8] pb-2">
        {title}
      </h2>
      <div className="font-dm-sans text-[15px] text-[#4a3728] leading-relaxed space-y-4 [&_h4]:font-semibold [&_h4]:text-[#1a120b] [&_h4]:mt-4 [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[#b8882e] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#9a6e1c]">
        {children}
      </div>
    </section>
  );
}
