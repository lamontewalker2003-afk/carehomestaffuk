import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling, ShieldCheck } from "lucide-react";
import { getJobBySlug, getSiteSettings } from "@/lib/store";
import type { Job, SiteSettings } from "@/lib/store";
import NotFound from "./NotFound";

function buildJobPostingJsonLd(job: Job, site: SiteSettings, canonicalUrl: string) {
  const datePosted = job.createdAt ? new Date(job.createdAt) : new Date();
  const validThrough = job.validThrough
    ? new Date(job.validThrough)
    : new Date(datePosted.getTime() + 90 * 24 * 60 * 60 * 1000);

  const titleSuffix = job.visaSponsorship ? " (Skilled Worker Visa Sponsorship)" : "";
  const sponsorBlock = job.visaSponsorship
    ? `<p><strong>UK Visa Sponsorship: Available for eligible international applicants via a licensed UK Home Office Sponsor.</strong></p>`
    : "";

  const reqList = (job.requirements || []).filter(Boolean)
    .map(r => `<li>${escapeHtml(r)}</li>`).join("");
  const reqBlock = reqList ? `<p><strong>Requirements:</strong></p><ul>${reqList}</ul>` : "";
  const descParas = (job.description || "").split(/\n+/).filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`).join("");

  const description = [sponsorBlock, descParas, reqBlock].filter(Boolean).join("");

  const empType = mapEmploymentType(job.type);

  const baseSalary: any = {};
  if (job.salaryMin || job.salaryMax) {
    const value: any = { "@type": "QuantitativeValue", unitText: "YEAR" };
    if (job.salaryMin && job.salaryMax) {
      value.minValue = job.salaryMin;
      value.maxValue = job.salaryMax;
    } else {
      value.value = job.salaryMin || job.salaryMax;
    }
    baseSalary["@type"] = "MonetaryAmount";
    baseSalary.currency = "GBP";
    baseSalary.value = value;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logo = job.companyLogoUrl
    ? job.companyLogoUrl
    : `${origin}/placeholder.svg`;

  const jsonLd: any = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: (job.title || "").trim() + titleSuffix,
    description,
    datePosted: datePosted.toISOString(),
    validThrough: validThrough.toISOString(),
    employmentType: empType,
    hiringOrganization: {
      "@type": "Organization",
      name: site.siteName,
      sameAs: origin,
      logo,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: job.streetAddress || "",
        addressLocality: job.city || job.location || "",
        addressRegion: job.region || "",
        postalCode: job.postcode || "",
        addressCountry: "GB",
      },
    },
    directApply: true,
    url: canonicalUrl,
    identifier: {
      "@type": "PropertyValue",
      name: site.siteName,
      value: job.id,
    },
  };
  if (Object.keys(baseSalary).length) jsonLd.baseSalary = baseSalary;
  if (job.visaSponsorship) {
    jsonLd.eligibilityToWorkRequirement =
      "UK Visa Sponsorship available for eligible international applicants under the Skilled Worker route.";
  }
  return jsonLd;
}

function mapEmploymentType(t: string): string | string[] {
  const x = (t || "").toLowerCase();
  if (x.includes("part")) return "PART_TIME";
  if (x.includes("contract")) return "CONTRACTOR";
  if (x.includes("temp")) return "TEMPORARY";
  if (x.includes("intern")) return "INTERN";
  if (x.includes("volunteer")) return "VOLUNTEER";
  if (x.includes("per diem")) return "PER_DIEM";
  return "FULL_TIME";
}

function escapeHtml(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    Promise.all([getJobBySlug(slug), getSiteSettings()]).then(([j, s]) => {
      setJob(j); setSite(s); setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading position…</div>
    );
  }

  // Treat missing or expired/inactive jobs as 404 so Google removes them.
  const expired = job?.validThrough ? new Date(job.validThrough).getTime() < Date.now() : false;
  if (!job || !job.isActive || expired) {
    return <NotFound />;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonical = `${origin}/jobs/${job.slug}`;
  const jsonLd = site ? buildJobPostingJsonLd(job, site, canonical) : null;
  const titleSuffix = job.visaSponsorship ? " (Skilled Worker Visa Sponsorship)" : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{`${job.title}${titleSuffix} — ${site?.siteName || ""}`}</title>
        <link rel="canonical" href={canonical} />
        <meta name="description" content={(job.description || "").slice(0, 155)} />
        {jsonLd && (
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        )}
      </Helmet>
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">
              {job.title}{titleSuffix}
            </h1>
            <p className="text-hero-foreground/70 mt-2">SOC {job.socCode} · {job.location}</p>
          </div>
        </div>

        <div className="container py-10 max-w-3xl space-y-6">
          {job.visaSponsorship && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm">
                <strong>UK Visa Sponsorship:</strong> Available for eligible international applicants via a licensed UK Home Office Sponsor.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.type}</span>
            {job.salary && <span className="flex items-center gap-1"><PoundSterling className="h-4 w-4" /> {job.salary}</span>}
          </div>

          {job.description && (
            <div className="prose prose-sm max-w-none">
              {job.description.split(/\n+/).filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div>
              <h2 className="font-heading text-xl font-semibold mb-2">Requirements</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          <div className="pt-4">
            <Link to={`/apply?job=${job.id}`}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Apply for this position
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
