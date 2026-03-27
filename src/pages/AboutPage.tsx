import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Heart, Award, Globe } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">About Us</h1>
            <p className="text-hero-foreground/70 mt-2">Dedicated to quality care staffing across the UK</p>
          </div>
        </div>

        <div className="container py-10 max-w-3xl space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            CareHomeStaffUK is a specialist recruitment agency focused on placing compassionate, qualified healthcare professionals in care homes throughout the United Kingdom. We bridge the gap between talented care workers and care homes that need them.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Our Mission", desc: "To ensure every care home has access to dedicated, skilled staff who genuinely care about the wellbeing of residents." },
              { icon: Award, title: "Our Standards", desc: "Every candidate undergoes thorough vetting, including DBS checks, qualification verification, and reference checks." },
              { icon: Globe, title: "International Reach", desc: "We support overseas care workers through the Health and Care Worker visa process, helping them build rewarding careers in the UK." },
            ].map((item, i) => (
              <div key={i} className="bg-secondary rounded-lg p-5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-heading text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-heading text-2xl font-semibold mb-4">SOC Codes We Specialise In</h2>
            <div className="space-y-3">
              {[
                { code: "6131", title: "Nursing Auxiliaries and Assistants", desc: "Supporting registered nurses with patient care, monitoring vital signs, and assisting with daily activities." },
                { code: "6135", title: "Care Workers and Home Carers", desc: "Providing personal care, meal preparation, companionship, and daily living support to residents." },
                { code: "6136", title: "Senior Care Workers", desc: "Leading care teams, managing care plans, administering medication, and mentoring junior staff." },
              ].map((item) => (
                <div key={item.code} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">SOC {item.code}</span>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default AboutPage;
