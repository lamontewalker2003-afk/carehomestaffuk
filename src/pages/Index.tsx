import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JobCard } from "@/components/JobCard";
import { getPublicJobs, getSiteSettings, defaultSiteSettings } from "@/lib/store";
import type { Job, SiteSettings } from "@/lib/store";
import { Shield, Users, Heart, ArrowRight, Award, Building2, Globe2, CheckCircle2, FileText, Sparkles } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";

const features = [
  { icon: Shield, title: "Fully Vetted Staff", desc: "DBS checked and verified professionals with care qualifications." },
  { icon: Users, title: "Visa Sponsorship", desc: "We support Health and Care Worker visa applications for overseas talent." },
  { icon: Heart, title: "Compassionate Care", desc: "Every worker is selected for their dedication to resident wellbeing." },
];


const trustedOrgs = [
  { name: "Care Quality Commission", icon: Award },
  { name: "NHS Partners", icon: Building2 },
  { name: "UK Visas & Immigration", icon: Globe2 },
  { name: "Skills for Care", icon: CheckCircle2 },
];

const whyChooseUs = [
  "Free recruitment service for all job seekers — no fees ever",
  "Licensed sponsor employers with genuine care home vacancies",
  "Full visa sponsorship support for Health and Care Worker visa",
  "DBS checks and qualification verification included",
  "Dedicated support from application to placement",
  "Nationwide coverage across England, Scotland, Wales & NI",
];

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [site, setSite] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    getJobs().then(allJobs => setJobs(allJobs.filter(j => j.isActive).slice(0, 3)));
    getSiteSettings().then(setSite);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative bg-hero overflow-hidden">
        <div className="container py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full">
              ✦ UK Jobs · Visa Sponsorship · Free CV & Cover Letter Tools
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-hero-foreground leading-tight">
              Land Your Next Job in the{" "}
              <span className="text-hero-accent">United Kingdom</span>
            </h1>
            <p className="text-hero-foreground/80 text-lg max-w-xl">
              From healthcare and hospitality to warehousing, retail and skilled trades — we help UK residents and international applicants find sponsored roles, switch visas (PSW, Student, Dependant), and land interviews. Try our free <strong>AI CV Builder</strong> and <strong>Cover Letter Generator</strong> — no signup needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Browse Jobs
                </Button>
              </Link>
              <Link to="/cv-builder">
                <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold border-2 border-accent">
                  <Sparkles className="h-4 w-4 mr-2" /> Build my CV (Free)
                </Button>
              </Link>
              <Link to="/apply">
                <Button size="lg" variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 font-semibold">
                  Apply as a Worker <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-hero-foreground/60 pt-1">
              <FileText className="h-3 w-3 inline mr-1" />
              CV Builder & Cover Letter Generator are open to guests — try them before applying.
            </p>
          </div>
          <div className="hidden lg:block">
            <img
              src={heroCare}
              alt="Healthcare worker caring for elderly resident in UK care home"
              className="rounded-lg shadow-2xl object-cover w-full h-[400px]"
              width={1280}
              height={720}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold mb-2">Trusted Across the UK Care Sector</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">We work alongside leading organisations and regulatory bodies to ensure the highest standards in care recruitment.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {trustedOrgs.map((org, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card text-center">
                <org.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{org.name}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {site.homepageStats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-lg bg-secondary">
                <p className="font-heading text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      {((site.cosPartners?.length || 0) > 0 || (site.careHomePartners?.length || 0) > 0) && (
        <section className="py-16 border-t">
          <div className="container space-y-12">
            {(site.cosPartners?.length || 0) > 0 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-heading text-2xl font-bold mb-2">Our CoS Sponsor Partners</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">Licensed sponsor companies that issue Certificates of Sponsorship for Health and Care Worker visa applicants through our network.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {site.cosPartners.map((p, i) => (
                    <a
                      key={i}
                      href={p.website || '#'}
                      target={p.website ? '_blank' : undefined}
                      rel={p.website ? 'noopener noreferrer' : undefined}
                      className="rounded-lg border bg-card p-4 flex flex-col items-center justify-center gap-3 text-center text-sm font-medium hover:border-primary hover:shadow-sm transition min-h-[120px]"
                    >
                      {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="h-12 w-auto max-w-full object-contain" loading="lazy" />}
                      <span>{p.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(site.careHomePartners?.length || 0) > 0 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="font-heading text-2xl font-bold mb-2">Care Homes We Work With Directly</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">Trusted care providers we partner with directly to place qualified staff.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {site.careHomePartners.map((p, i) => (
                    <a
                      key={i}
                      href={p.website || '#'}
                      target={p.website ? '_blank' : undefined}
                      rel={p.website ? 'noopener noreferrer' : undefined}
                      className="rounded-lg border bg-card p-4 flex flex-col items-center justify-center gap-3 text-center text-sm font-medium hover:border-primary hover:shadow-sm transition min-h-[120px]"
                    >
                      {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="h-12 w-auto max-w-full object-contain" loading="lazy" />}
                      <span>{p.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Why Choose CareHomeStaffUK?</h2>
              <div className="space-y-3">
                {whyChooseUs.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-lg border p-8 space-y-4">
              <h3 className="font-heading text-xl font-semibold">Most Applicants Need Visa Sponsorship</h3>
              <p className="text-sm text-muted-foreground">The majority of our candidates require Health and Care Worker visa sponsorship. We specialise in connecting international healthcare professionals with UK care homes that hold valid sponsor licences.</p>
              <div className="space-y-2 text-sm">
                <p><strong>SOC 6131:</strong> Nursing Auxiliaries & Assistants</p>
                <p><strong>SOC 6135:</strong> Care Workers & Home Carers</p>
                <p><strong>SOC 6136:</strong> Senior Care Workers</p>
              </div>
              <Link to="/visa-info">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground mt-2">
                  Learn About Visa Sponsorship →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Latest Opportunities</h2>
            <Link to="/jobs" className="text-sm text-primary flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container text-center space-y-6">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground">
            Ready to Start Your Care Career in the UK?
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto">
            Whether you're a UK resident or applying from overseas with a Health and Care Worker visa, we can help you find the right position.
          </p>
          <Link to="/apply">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              Apply Now
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
