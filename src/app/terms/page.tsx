import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Khali",
  description:
    "Terms and conditions governing your use of the Khali news app.",
};

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <div className="w-16 h-[3px] bg-[#d4a847] mb-4" />
          <p className="font-dm-sans text-sm text-[#8a7060]">
            Last updated: April 2, 2026
          </p>
        </div>

        {/* Content */}
        <article className="space-y-10">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the Khali application and website
              (collectively, the &ldquo;Service&rdquo;), you agree to be bound
              by these Terms of Service (&ldquo;Terms&rdquo;). If you do not
              agree to these Terms, you may not use the Service.
            </p>
            <p>
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the modified Terms.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Khali is a personalized, AI-powered news platform that delivers
              bite-sized stories through short videos, podcasts, and articles.
              The Service includes:
            </p>
            <ul>
              <li>
                A personalized news feed curated by AI based on your preferences
                and behavior.
              </li>
              <li>
                Short-form video clips, podcast-style audio, and article
                summaries.
              </li>
              <li>
                AI-generated fact-based headlines and bullet points.
              </li>
              <li>
                A &ldquo;Both Sides&rdquo; feature presenting multiple political
                perspectives.
              </li>
              <li>
                Interactive features including voting, Q&amp;A, and content
                engagement tools.
              </li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <p>
              To access certain features of the Service, you must create an
              account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete registration information.</li>
              <li>
                Maintain the security of your account credentials.
              </li>
              <li>
                Promptly update your information if it changes.
              </li>
              <li>
                Accept responsibility for all activity under your account.
              </li>
            </ul>
            <p>
              You must be at least 13 years old to create an account. If you are
              under 18, you represent that you have your parent or
              guardian&apos;s consent to use the Service.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable law or regulation.
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
                or its systems.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service.
              </li>
              <li>
                Use automated means (bots, scrapers, etc.) to access or collect
                data from the Service without our written permission.
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your
                affiliation.
              </li>
              <li>
                Upload or transmit viruses, malware, or other harmful code.
              </li>
              <li>
                Harass, abuse, or harm other users through the interactive
                features.
              </li>
            </ul>
          </Section>

          <Section title="5. Content and Intellectual Property">
            <h4>Our content</h4>
            <p>
              All content provided through the Service &mdash; including but not
              limited to AI-generated summaries, headlines, compilations, user
              interface elements, graphics, and branding &mdash; is owned by or
              licensed to Khali and protected by copyright, trademark, and other
              intellectual property laws.
            </p>

            <h4>Third-party content</h4>
            <p>
              News stories, articles, videos, and other media delivered through
              Khali may originate from third-party sources. We provide summaries
              and excerpts under fair use principles and applicable licenses. We
              do not claim ownership of third-party content.
            </p>

            <h4>User-generated content</h4>
            <p>
              By submitting votes, questions, or other content through
              interactive features, you grant Khali a non-exclusive, worldwide,
              royalty-free license to use, display, and distribute that content
              in connection with the Service.
            </p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p>
              Khali uses artificial intelligence to generate summaries,
              headlines, and content recommendations. While we strive for
              accuracy:
            </p>
            <ul>
              <li>
                AI-generated content is provided for informational purposes only
                and should not be relied upon as the sole source of news or
                information.
              </li>
              <li>
                We do not guarantee the accuracy, completeness, or timeliness of
                AI-generated summaries.
              </li>
              <li>
                The &ldquo;Both Sides&rdquo; feature presents perspectives for
                informational balance and does not constitute an endorsement of
                any political viewpoint.
              </li>
              <li>
                We encourage users to consult original sources for complete and
                authoritative information.
              </li>
            </ul>
          </Section>

          <Section title="7. Subscriptions and Payments">
            <p>
              Certain features of the Service may require a paid subscription.
              If you purchase a subscription:
            </p>
            <ul>
              <li>
                Payments are processed through the Apple App Store or other
                authorized payment platforms.
              </li>
              <li>
                Subscriptions automatically renew unless cancelled at least 24
                hours before the end of the current billing period.
              </li>
              <li>
                Refunds are subject to the policies of the applicable app store
                or payment platform.
              </li>
              <li>
                We reserve the right to change subscription pricing with
                reasonable notice.
              </li>
            </ul>
          </Section>

          <Section title="8. Termination">
            <p>
              We may suspend or terminate your account if you violate these Terms
              or if we discontinue the Service. You may delete your account at
              any time through the app settings or by contacting us.
            </p>
            <p>
              Upon termination, your right to use the Service ceases
              immediately. Sections that by their nature should survive
              termination (including intellectual property, limitation of
              liability, and dispute resolution) will remain in effect.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied, including but not limited to warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure,
              or error-free, or that any content will be accurate or reliable.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Khali and its
              officers, directors, employees, and agents shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits or revenues, whether incurred
              directly or indirectly, or any loss of data, use, goodwill, or
              other intangible losses resulting from:
            </p>
            <ul>
              <li>Your use of or inability to use the Service.</li>
              <li>
                Any unauthorized access to or alteration of your data.
              </li>
              <li>
                Any content obtained from the Service, including AI-generated
                content.
              </li>
              <li>
                Any other matter relating to the Service.
              </li>
            </ul>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Khali and its
              affiliates from and against any claims, liabilities, damages,
              losses, and expenses (including reasonable attorneys&apos; fees)
              arising out of or in connection with your use of the Service or
              violation of these Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Delaware, United States, without regard to
              its conflict of law provisions. Any disputes arising under these
              Terms shall be resolved in the courts located in Delaware.
            </p>
          </Section>

          <Section title="13. Severability">
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary, and the remaining provisions shall remain
              in full force and effect.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:legal@khali.app">legal@khali.app</a>
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
              className="font-dm-sans text-xs text-[#4a3728] hover:text-[#1a120b] transition-colors font-semibold"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="font-dm-sans text-xs text-[#4a3728] hover:text-[#1a120b] transition-colors"
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
