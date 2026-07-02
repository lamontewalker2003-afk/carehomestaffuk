import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WhatsAppLink } from "@/components/WhatsAppButton";
import { getSiteSettings } from "@/lib/store";
import type { SiteSettings, SponsorCompany } from "@/lib/store";
import { Building2, MapPin, Globe, MessageCircle, Search, ShieldCheck, Briefcase, ArrowRight } from "lucide-react";

const SponsorCompaniesPage = () => {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>("");

  useEffect(() => { getSiteSettings().then(setSite); }, []);

  const companies: SponsorCompany[] = site?.sponsorCompanies || [];

  const sectors = useMemo(
    () => Array.from(new Set(companies.map(c => c.sector || "Other"))).sort(),
    [companies]
  );

  const filtered = companies.filter(c => {
    if (sector && (c.sector || "Other") !== sector) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [c.name, c.sector, c.location, c.rolesOffered, c.description, c.socCodes]
      .some(v => (v || "").toLowerCase().includes(s));
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>UK Companies Offering Certificate of Sponsorship (CoS) | CareHomeStaffUK</title>
        <meta name="description" content="Browse UK care companies licensed to issue Certificates of Sponsorship for Health and Care Worker visa applicants. Apply directly or message our team on WhatsApp for guidance." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/sponsor-companies" : ""} />
      </Helmet>
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-hero py-14">
          <div className="container max-w-4xl text-center space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" /> Licensed UK CoS Sponsors
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-hero-foreground">
              UK Companies Offering Certificate of Sponsorship
            </h1>
            <p className="text-hero-foreground/80 max-w-2xl mx-auto">
              These UK employers are certified by the Home Office to issue Certificates of Sponsorship for Health and Care Worker visa applicants. Submit one general eligibility check below — our team privately reviews your profile and confidentially matches you to the right licensed sponsor.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Link to="/apply">
                <Button size="lg" className="bg-hero-accent text-hero-foreground hover:bg-hero-accent/90">
                  Check eligibility & register interest <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-10 max-w-6xl space-y-6">
          <div className="grid sm:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name, role, SOC code or location…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All sectors</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-10 text-center">
              No companies match your search. Try a different term or clear the filter.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((c) => (
                <div key={c.id} className="bg-card border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/40 transition">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-primary/5 border flex items-center justify-center overflow-hidden shrink-0">
                      {c.logoUrl
                        ? <img src={c.logoUrl} alt={c.name} className="h-full w-full object-contain" loading="lazy" />
                        : <Building2 className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold leading-tight">{c.name}</h3>
                      {c.sector && <p className="text-xs text-muted-foreground mt-0.5">{c.sector}</p>}
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {c.location && <Badge variant="secondary" className="font-normal"><MapPin className="h-3 w-3 mr-1" />{c.location}</Badge>}
                    {c.socCodes && <Badge variant="outline" className="font-normal">SOC {c.socCodes}</Badge>}
                  </div>

                  {c.rolesOffered && (
                    <p className="text-xs">
                      <span className="text-muted-foreground"><Briefcase className="h-3 w-3 inline mr-1" />Roles: </span>
                      <span className="font-medium">{c.rolesOffered}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 border-t">
                    <Badge className="bg-primary/10 text-primary border border-primary/20 font-normal">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Licensed sponsor
                    </Badge>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} website`} className="ml-auto text-muted-foreground hover:text-primary p-1.5 rounded-md hover:bg-muted">
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center mt-6">
            <h2 className="font-heading text-xl font-semibold mb-2">How matching works</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
              You submit one general eligibility check. Our advisors review your background and confidentially introduce you to the best-fit licensed UK sponsor. You'll receive the matched employer's details by email — there's no need to contact companies directly.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link to="/apply">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Check eligibility & register interest <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SponsorCompaniesPage;
