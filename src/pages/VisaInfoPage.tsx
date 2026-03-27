import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

const sections = [
  {
    title: "What is the Health and Care Worker Visa?",
    content: "The Health and Care Worker visa allows medical professionals to come to or stay in the UK to do an eligible health or care job. It is a subcategory of the Skilled Worker visa with reduced fees and no Immigration Health Surcharge.",
  },
  {
    title: "Eligible SOC Codes for Care Work",
    items: [
      "6131 — Nursing Auxiliaries and Assistants",
      "6135 — Care Workers and Home Carers",
      "6136 — Senior Care Workers",
    ],
  },
  {
    title: "Requirements",
    items: [
      "A confirmed job offer from a UK employer with a sponsor licence",
      "Certificate of Sponsorship (CoS) from your employer",
      "Meet the minimum salary threshold (currently £20,960 or the 'going rate' for the role)",
      "English language proficiency (IELTS SELT or equivalent at B1 level)",
      "Proof of personal savings of at least £1,270 for 28 consecutive days",
      "TB test certificate (if applying from a listed country)",
      "Criminal record certificate from any country you've lived in for 12+ months",
    ],
  },
  {
    title: "Benefits of the Health and Care Worker Visa",
    items: [
      "No Immigration Health Surcharge (IHS) — saving up to £1,035 per year",
      "Reduced visa application fees",
      "Can bring dependants (spouse/partner and children)",
      "Path to settlement (Indefinite Leave to Remain) after 5 years",
      "Right to work full-time in your sponsored role",
      "Can take on supplementary employment in a shortage occupation",
    ],
  },
  {
    title: "Application Process",
    items: [
      "1. Secure a job offer with a licensed sponsor employer",
      "2. Receive your Certificate of Sponsorship (CoS)",
      "3. Gather required documents (passport, English test, TB cert, savings evidence)",
      "4. Apply online via the UK Government visa portal",
      "5. Pay the application fee and attend a biometric appointment",
      "6. Wait for decision (usually 3–8 weeks from outside the UK)",
    ],
  },
];

const VisaInfoPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Health and Care Worker Visa</h1>
            <p className="text-hero-foreground/70 mt-2">Everything you need to know about working in UK care homes</p>
          </div>
        </div>

        <div className="container py-10 max-w-3xl">
          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <h2 className="font-heading text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                )}
                {section.items && (
                  <ul className="space-y-2 mt-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-5 flex gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Important Note</h3>
                <p className="text-sm text-muted-foreground">
                  Visa rules and fees are subject to change. Always check the latest guidance on{" "}
                  <a href="https://www.gov.uk/health-care-worker-visa" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    GOV.UK
                  </a>{" "}
                  before applying.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default VisaInfoPage;
