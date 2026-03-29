import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <main className="flex-1">
      <div className="bg-hero py-12">
        <div className="container">
          <h1 className="font-heading text-3xl font-bold text-hero-foreground">Privacy Policy</h1>
          <p className="text-hero-foreground/70 mt-2">How we collect, use, and protect your personal data</p>
        </div>
      </div>
      <div className="container py-10 max-w-3xl prose prose-sm">
        <p className="text-muted-foreground text-sm mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">1. Who We Are</h2>
        <p className="text-sm text-muted-foreground mb-4">CareHomeStaffUK is a recruitment service connecting care homes across the United Kingdom with qualified healthcare professionals. We are committed to protecting your privacy in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">2. Data We Collect</h2>
        <p className="text-sm text-muted-foreground mb-2">We may collect and process the following personal data:</p>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mb-4">
          <li>Full name, email address, and telephone number</li>
          <li>Nationality, current location, and visa/immigration status</li>
          <li>Employment history, qualifications, and experience</li>
          <li>CV/resume documents and cover letters</li>
          <li>DBS check results (where applicable)</li>
          <li>Right to work documentation</li>
        </ul>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">3. Legal Basis for Processing</h2>
        <p className="text-sm text-muted-foreground mb-4">We process your data under the following lawful bases as defined by the UK GDPR (Article 6): legitimate interest in providing recruitment services, consent where you voluntarily submit your application, and legal obligation to verify right to work in the UK.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">4. How We Use Your Data</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mb-4">
          <li>To match you with suitable care home positions</li>
          <li>To communicate with you regarding your application</li>
          <li>To share your profile with prospective employers (with your consent)</li>
          <li>To verify your identity and right to work</li>
          <li>To comply with our legal and regulatory obligations</li>
        </ul>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">5. Data Sharing</h2>
        <p className="text-sm text-muted-foreground mb-4">We may share your personal data with: prospective employers (care homes) for recruitment purposes, the Home Office or UK Visas & Immigration (UKVI) as required for visa sponsorship, and third-party service providers who assist with our operations (e.g. IT, communications). We will never sell your data to third parties.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">6. Data Retention</h2>
        <p className="text-sm text-muted-foreground mb-4">We retain your data for as long as necessary for the purposes outlined above. Unsuccessful applicant data is typically retained for 12 months, after which it is securely deleted unless you request earlier removal.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
        <p className="text-sm text-muted-foreground mb-2">Under the UK GDPR, you have the right to:</p>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mb-4">
          <li>Access your personal data (Subject Access Request)</li>
          <li>Rectify inaccurate data</li>
          <li>Erase your data ("right to be forgotten")</li>
          <li>Restrict or object to processing</li>
          <li>Data portability</li>
          <li>Lodge a complaint with the Information Commissioner's Office (ICO) — <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a></li>
        </ul>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">8. Cookies</h2>
        <p className="text-sm text-muted-foreground mb-4">Our website uses essential cookies for functionality. We do not use third-party tracking or advertising cookies. For more details, refer to our cookie notice.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">9. Contact Us</h2>
        <p className="text-sm text-muted-foreground mb-4">For any data protection queries, please contact us via our Contact page or email us at privacy@carehomestaffuk.com.</p>

        <div className="bg-secondary rounded-lg p-6 mt-8">
          <p className="text-xs text-muted-foreground">This privacy policy is provided in accordance with the requirements of the UK GDPR and the Data Protection Act 2018. For further guidance, visit the <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ICO's UK GDPR guidance</a>.</p>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default PrivacyPolicyPage;
