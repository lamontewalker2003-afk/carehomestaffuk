import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://carehomestaffuk.com";
const SITE_NAME = "CareHomeStaffUK";

// Master keyword pool — UK Health & Care Worker visa, all sponsorship pathways, all roles,
// all migrant audiences (PSW, dependants, switch routes, students, refugees, EU pre-settled, etc.)
const GLOBAL_KEYWORDS = [
  // Core jobs
  "care home jobs UK", "care worker jobs UK", "care assistant jobs UK", "carer jobs UK",
  "senior carer jobs", "senior care worker jobs UK", "nursing auxiliary jobs UK",
  "healthcare assistant jobs UK", "HCA jobs UK", "nursing assistant jobs UK",
  "support worker jobs UK", "live-in carer jobs UK", "domiciliary care jobs UK",
  "dementia carer jobs UK", "learning disability support worker UK",
  "mental health care worker jobs UK", "palliative care jobs UK",
  // Visa sponsorship
  "care home jobs with visa sponsorship", "UK visa sponsorship jobs",
  "Health and Care Worker visa", "Tier 2 health and care visa",
  "Skilled Worker visa care worker", "Certificate of Sponsorship UK",
  "CoS care worker UK", "sponsored care jobs UK", "free CoS care jobs UK",
  "care jobs no agency fee UK", "sponsored healthcare assistant UK",
  "SOC 6131", "SOC 6135", "SOC 6136", "SOC 6145", "SOC 6146",
  // Audience: migrants & switch routes
  "PSW to skilled worker visa UK", "graduate visa to health care worker visa",
  "switch student visa to care worker visa UK", "Tier 4 to Tier 2 switch UK",
  "dependant visa care work UK", "spouse visa care worker UK",
  "BRP holder care jobs UK", "EU pre-settled status care jobs",
  "refugee care worker jobs UK", "asylum seeker work permit care UK",
  "international nurse OSCE jobs UK", "overseas nurse UK NMC",
  "Nigeria to UK care work visa", "India to UK care worker visa",
  "Philippines to UK nurse visa", "Ghana to UK care worker",
  "Kenya to UK care worker visa", "Zimbabwe to UK care worker visa",
  "Pakistan to UK care worker visa", "Bangladesh to UK care worker visa",
  "Nepal to UK care worker visa",
  // Questions people ask
  "how to get UK care worker visa", "how to find a care home sponsor UK",
  "minimum salary care worker visa UK", "how long does CoS take UK",
  "can care workers bring family UK", "care worker visa requirements 2026",
  "do I need IELTS for care worker visa", "is care worker job in UK shortage occupation",
  // Locations
  "care jobs London", "care jobs Manchester", "care jobs Birmingham",
  "care jobs Liverpool", "care jobs Leeds", "care jobs Sheffield",
  "care jobs Bristol", "care jobs Newcastle", "care jobs Glasgow",
  "care jobs Edinburgh", "care jobs Aberdeen", "care jobs Dundee",
  "care jobs Cardiff", "care jobs Belfast", "care jobs Nottingham",
  // Recruitment & agency
  "UK care recruitment agency", "ethical international recruitment UK",
  "NHS care worker recruitment", "care home staffing UK", "CQC-registered care recruiter",
].join(", ");

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Care Home Jobs UK with Visa Sponsorship | Health & Care Worker Visa — CareHomeStaffUK",
    description:
      "UK care home jobs with Health and Care Worker visa sponsorship. Carers, healthcare assistants, senior carers, nursing auxiliaries (SOC 6131/6135/6136). Switch from PSW, student, dependant or spouse visa. Free Certificate of Sponsorship (CoS) through CQC-aligned partners.",
  },
  "/jobs": {
    title: "UK Care Worker Vacancies with Visa Sponsorship | Browse Jobs",
    description:
      "Browse live UK care jobs with visa sponsorship — care assistants, senior carers, HCAs and nursing auxiliaries. Filter by city, SOC code and salary. Sponsored roles for international applicants & PSW switchers.",
  },
  "/jobs/": {
    title: "UK Care Worker Vacancies with Visa Sponsorship | Browse Jobs",
    description:
      "Live UK care jobs with Health & Care Worker visa sponsorship. Care homes hiring across England, Scotland and Wales.",
  },
  "/apply": {
    title: "Apply for a Sponsored UK Care Job | Free Application — CareHomeStaffUK",
    description:
      "Free application for sponsored UK care worker jobs. Open to international applicants, PSW/graduate visa switchers, dependants, spouses and BRP holders. Upload your CV — our team replies within 48h.",
  },
  "/visa-info": {
    title: "Health and Care Worker Visa UK 2026 | Sponsorship Guide & Requirements",
    description:
      "Complete 2026 guide to the UK Health and Care Worker visa: salary thresholds, IELTS/English, dependants, switching from student, PSW or spouse visa, Certificate of Sponsorship process, costs and timelines.",
  },
  "/about": {
    title: "About CareHomeStaffUK | Ethical UK Care Recruitment & Visa Sponsorship",
    description:
      "CareHomeStaffUK connects qualified and trainee carers worldwide with CQC-registered UK care homes offering Health & Care Worker visa sponsorship. Ethical recruitment, transparent fees.",
  },
  "/contact": {
    title: "Contact CareHomeStaffUK | Care Visa Sponsorship Enquiries UK",
    description:
      "Talk to our UK team about sponsored care jobs, Certificate of Sponsorship, visa switching from PSW/student/spouse routes, or staffing your care home. Email, phone & WhatsApp.",
  },
  "/faq": {
    title: "FAQ | UK Care Worker Visa, Sponsorship & Care Home Jobs",
    description:
      "Answers to common questions: How to get a UK care worker visa? Salary thresholds? Switching from PSW or student visa? Bringing dependants? Costs, timelines, IELTS, CoS — explained.",
  },
  "/testimonials": {
    title: "Testimonials | UK Care Worker Visa Success Stories — CareHomeStaffUK",
    description:
      "Real stories from international carers and care homes placed by CareHomeStaffUK — from CoS to UK arrival, including PSW and student visa switchers.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | CareHomeStaffUK | UK GDPR Compliant",
    description:
      "How CareHomeStaffUK collects, uses and protects applicant data, in line with the UK GDPR, Data Protection Act 2018 and PECR.",
  },
  "/terms": {
    title: "Terms & Conditions | CareHomeStaffUK Recruitment Services",
    description:
      "Terms of use for CareHomeStaffUK recruitment services, compliant with the Employment Agencies Act 1973 and UK employment legislation.",
  },
  "/book-appointment": {
    title: "Book a Free UK Care Visa Consultation | CareHomeStaffUK",
    description:
      "Book a 30-minute consultation with our UK care recruitment team. Discuss Health & Care Worker visa sponsorship, CoS, PSW switch routes, family visas and live job openings.",
  },
  "/appointments/manage": {
    title: "Manage Your Appointment | Reschedule or Cancel — CareHomeStaffUK",
    description:
      "Reschedule or cancel your CareHomeStaffUK consultation. Look up your booking by email and pick a new working-day slot.",
  },
};

export function SEOHead() {
  const { pathname } = useLocation();
  // Match dynamic /appointments/manage/:id and /jobs/:slug
  let metaKey = pathname;
  if (pathname.startsWith("/appointments/manage")) metaKey = "/appointments/manage";
  if (pathname.startsWith("/jobs/") && pathname !== "/jobs") metaKey = "/jobs";
  const meta = pageMeta[metaKey] || pageMeta["/"]!;
  const canonicalUrl = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Ethical UK recruitment agency for care homes — sponsoring Health and Care Worker visas for carers, healthcare assistants, senior carers and nursing auxiliaries (SOC 6131, 6135, 6136). Supports PSW, student, dependant and spouse visa switchers.",
    address: { "@type": "PostalAddress", addressCountry: "GB" },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    serviceType: [
      "Healthcare Recruitment", "UK Visa Sponsorship", "Care Home Staffing",
      "Certificate of Sponsorship (CoS)", "Skilled Worker Visa Switching",
    ],
    knowsAbout: [
      "SOC 6131 Nursing Auxiliaries and Assistants",
      "SOC 6135 Care Workers and Home Carers",
      "SOC 6136 Senior Care Workers",
      "Health and Care Worker Visa UK",
      "Skilled Worker visa switch from Graduate / PSW visa",
      "Student visa to care worker visa switch",
      "Dependant and spouse visa care work",
      "UK CQC-registered care home recruitment",
    ],
  };

  const faqJsonLd = metaKey === "/faq" || metaKey === "/visa-info" ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I switch from a Graduate (PSW) visa to a Health and Care Worker visa?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. PSW holders can switch in-country to the Health & Care Worker visa once they hold a Certificate of Sponsorship from a licensed UK care employer. CareHomeStaffUK helps PSW switchers find sponsoring care homes." },
      },
      {
        "@type": "Question",
        name: "What is the minimum salary for a UK care worker visa in 2026?",
        acceptedAnswer: { "@type": "Answer", text: "Care worker and senior care worker roles under the Health & Care Worker visa have role-specific thresholds. Our team confirms the current threshold per vacancy at the time of CoS issue." },
      },
      {
        "@type": "Question",
        name: "Do I need IELTS to apply?",
        acceptedAnswer: { "@type": "Answer", text: "You need approved English at B1 level — IELTS for UKVI, a degree taught in English, or an exempt nationality all qualify." },
      },
      {
        "@type": "Question",
        name: "Can I bring my family on the Health and Care Worker visa?",
        acceptedAnswer: { "@type": "Answer", text: "New care worker (SOC 6135) and senior carer (SOC 6136) applicants since 11 March 2024 cannot bring new dependants. Pre-existing dependants and nursing auxiliary applicants (SOC 6131) may still apply — we confirm eligibility case-by-case." },
      },
    ],
  } : null;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="United Kingdom" />
      <meta name="language" content="English" />

      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />

      <meta name="keywords" content={GLOBAL_KEYWORDS} />

      <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      {faqJsonLd && <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>}
    </Helmet>
  );
}
