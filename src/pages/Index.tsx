import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JobCard } from "@/components/JobCard";
import { getJobs } from "@/lib/store";
import { Shield, Users, Heart, ArrowRight } from "lucide-react";
import heroCare from "@/assets/hero-care.jpg";

const features = [
  { icon: Shield, title: "Fully Vetted Staff", desc: "DBS checked and verified professionals with care qualifications." },
  { icon: Users, title: "Visa Sponsorship", desc: "We support Health and Care Worker visa applications for overseas talent." },
  { icon: Heart, title: "Compassionate Care", desc: "Every worker is selected for their dedication to resident wellbeing." },
];

const Index = () => {
  const jobs = getJobs().filter(j => j.isActive).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative bg-hero overflow-hidden">
        <div className="container py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block text-xs font-semibold tracking-wider uppercase bg-hero-accent/20 text-hero-accent px-3 py-1 rounded-full">
              ✦ Trusted Across the UK
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-hero-foreground leading-tight">
              Compassionate Staff for{" "}
              <span className="text-hero-accent">Every Care Home</span>
            </h1>
            <p className="text-hero-foreground/70 text-lg max-w-md">
              We connect care homes with fully vetted nurses, carers, and support workers — ensuring the highest standard of care, every single shift.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Browse Jobs
                </Button>
              </Link>
              <Link to="/apply">
                <Button size="lg" className="bg-card text-primary hover:bg-card/90 font-semibold border-2 border-accent">
                  Apply as a Worker
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <img
              src={heroCare}
              alt="Healthcare worker caring for elderly resident"
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
