import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getSEOSettings } from "@/lib/store";

const SITE_URL = "https://carehomestaffuk.com";
const SITE_NAME = "CareHomeStaffUK";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Care Home Jobs UK | Visa Sponsorship | Nursing & Carer Vacancies — CareHomeStaffUK",
    description: "Find care home jobs across the UK with visa sponsorship. We recruit nursing auxiliaries (SOC 6131), care workers (SOC 6135), and senior care workers (SOC 6136). Apply today for Health and Care Worker visa sponsored positions.",
  },
  "/jobs": {
    title: "Available Care Home Positions | UK Care Worker Jobs with Visa Sponsorship",
    description: "Browse current care home vacancies across the UK. Nursing auxiliaries, care workers, and senior care worker positions with visa sponsorship available. Filter by location, SOC code, and job type.",
  },
  "/apply": {
    title: "Apply for Care Home Jobs UK | Free Application | Visa Sponsorship Available",
    description: "Apply for care home positions across the UK. Free application for nursing auxiliaries, care workers, and senior carers. Health and Care Worker visa sponsorship available for international candidates.",
  },
  "/visa-info": {
    title: "Health and Care Worker Visa UK | Sponsorship Guide | CareHomeStaffUK",
    description: "Complete guide to the UK Health and Care Worker visa. Learn about requirements, documents needed, sponsorship process, and how to apply for care home positions with visa support.",
  },
  "/about": {
    title: "About CareHomeStaffUK | Leading UK Care Home Recruitment Agency",
    description: "Learn about CareHomeStaffUK, a specialist recruitment agency connecting qualified healthcare professionals with care homes across the United Kingdom. Visa sponsorship expertise.",
  },
  "/contact": {
    title: "Contact CareHomeStaffUK | Get in Touch for Care Home Recruitment",
    description: "Contact CareHomeStaffUK for care home recruitment enquiries, visa sponsorship questions, or to discuss your staffing needs. We serve care homes and workers across the UK.",
  },
  "/faq": {
    title: "FAQ | Care Home Jobs, Visa Sponsorship & Recruitment Questions",
    description: "Frequently asked questions about care home jobs in the UK, Health and Care Worker visa sponsorship, recruitment process, and working in UK care homes.",
  },
  "/testimonials": {
    title: "Testimonials | Care Workers & Care Homes | CareHomeStaffUK Reviews",
    description: "Read testimonials from care workers and care homes who have used CareHomeStaffUK recruitment services. Real success stories from placed candidates and partner care homes.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | CareHomeStaffUK | UK GDPR Compliant",
    description: "CareHomeStaffUK privacy policy. How we collect, use, and protect your personal data in compliance with the UK GDPR and Data Protection Act 2018.",
  },
  "/terms": {
    title: "Terms & Conditions | CareHomeStaffUK",
    description: "Terms and conditions for using CareHomeStaffUK recruitment services. Compliant with UK employment legislation including the Employment Agencies Act 1973.",
  },
};

export function SEOHead() {
  const { pathname } = useLocation();
  const seo = getSEOSettings();
  const meta = pageMeta[pathname] || pageMeta["/"]!;
  const canonicalUrl = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    name: SITE_NAME,
    url: SITE_URL,
    description: "UK care home recruitment agency specialising in nursing auxiliaries, care workers, and senior care workers with Health and Care Worker visa sponsorship.",
    address: { "@type": "PostalAddress", addressCountry: "GB" },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    serviceType: ["Healthcare Recruitment", "Visa Sponsorship", "Care Home Staffing"],
    knowsAbout: [
      "SOC 6131 Nursing Auxiliaries and Assistants",
      "SOC 6135 Care Workers and Home Carers",
      "SOC 6136 Senior Care Workers",
      "Health and Care Worker Visa UK",
      "Care Home Recruitment",
    ],
  };

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />

      {/* Keywords */}
      <meta name="keywords" content={`care home jobs UK, care worker jobs, nursing auxiliary jobs, senior care worker, visa sponsorship UK, Health and Care Worker visa, SOC 6131, SOC 6135, SOC 6136, care home recruitment, care home staff, ${seo.searchKeywords.join(", ")}`} />

      {/* Search Console verification */}
      {seo.searchConsoleId && (
        <meta name="google-site-verification" content={seo.searchConsoleId} />
      )}

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
