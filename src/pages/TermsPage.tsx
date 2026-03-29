import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const TermsPage = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <main className="flex-1">
      <div className="bg-hero py-12">
        <div className="container">
          <h1 className="font-heading text-3xl font-bold text-hero-foreground">Terms & Conditions</h1>
          <p className="text-hero-foreground/70 mt-2">Please read these terms carefully before using our services</p>
        </div>
      </div>
      <div className="container py-10 max-w-3xl prose prose-sm">
        <p className="text-muted-foreground text-sm mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">1. Introduction</h2>
        <p className="text-sm text-muted-foreground mb-4">These Terms and Conditions govern your use of the CareHomeStaffUK website and recruitment services. By accessing our website or submitting an application, you agree to be bound by these terms. Our services are provided in accordance with UK employment law, including the Employment Agencies Act 1973 and the Conduct of Employment Agencies and Employment Businesses Regulations 2003.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">2. Our Services</h2>
        <p className="text-sm text-muted-foreground mb-4">CareHomeStaffUK provides recruitment services for the health and social care sector in the United Kingdom, specialising in SOC codes 6131 (Nursing Auxiliaries & Assistants), 6135 (Care Workers & Home Carers), and 6136 (Senior Care Workers). We connect qualified candidates with care homes that hold valid CQC (Care Quality Commission) registration.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">3. Eligibility</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mb-4">
          <li>You must be at least 18 years of age to use our services</li>
          <li>You must have the legal right to work in the UK, or be eligible for visa sponsorship under the Health and Care Worker visa route</li>
          <li>All information provided must be truthful and accurate</li>
          <li>You must hold or be willing to obtain a valid DBS (Disclosure and Barring Service) check</li>
        </ul>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">4. Visa Sponsorship</h2>
        <p className="text-sm text-muted-foreground mb-4">Where we facilitate visa sponsorship, this is subject to the employer holding a valid sponsor licence issued by UK Visas & Immigration (UKVI). Sponsorship fees, where applicable, are clearly stated in job listings. We act in accordance with the Immigration Rules and the UK Points-Based Immigration System. Neither CareHomeStaffUK nor our partner care homes guarantee visa approval — all applications are subject to UKVI decision.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">5. No Fees for Workers</h2>
        <p className="text-sm text-muted-foreground mb-4">In compliance with the Employment Agencies Act 1973, we do not charge job seekers any fees for our recruitment services. Any sponsorship fees listed relate to employer costs for visa processing and are not charged to applicants.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">6. Application Process</h2>
        <p className="text-sm text-muted-foreground mb-4">By submitting an application, you consent to: your information being shared with prospective employers, background checks including DBS verification, reference checks with previous employers, and verification of qualifications and right to work documentation.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">7. Intellectual Property</h2>
        <p className="text-sm text-muted-foreground mb-4">All content on this website, including text, graphics, logos, and software, is the property of CareHomeStaffUK and is protected under UK intellectual property law.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
        <p className="text-sm text-muted-foreground mb-4">While we endeavour to provide accurate and up-to-date information, CareHomeStaffUK does not guarantee employment outcomes. We are not liable for any decisions made by employers, visa authorities, or regulatory bodies. Our liability is limited to the extent permitted by English law.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">9. Governing Law</h2>
        <p className="text-sm text-muted-foreground mb-4">These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">10. Changes to These Terms</h2>
        <p className="text-sm text-muted-foreground mb-4">We reserve the right to update these terms at any time. Continued use of our website following any changes constitutes acceptance of the revised terms.</p>

        <h2 className="font-heading text-xl font-semibold mt-8 mb-3">11. Contact</h2>
        <p className="text-sm text-muted-foreground mb-4">For any queries regarding these terms, please contact us via our Contact page.</p>

        <div className="bg-secondary rounded-lg p-6 mt-8">
          <p className="text-xs text-muted-foreground">These terms comply with UK employment legislation including the Employment Agencies Act 1973, the Conduct of Employment Agencies and Employment Businesses Regulations 2003, and the Equality Act 2010.</p>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default TermsPage;
