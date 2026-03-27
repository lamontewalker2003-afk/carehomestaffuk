import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    category: "For Workers",
    items: [
      {
        q: "What types of care roles do you recruit for?",
        a: "We recruit for three main SOC codes: 6131 (Nursing Auxiliaries & Assistants), 6135 (Care Workers & Home Carers), and 6136 (Senior Care Workers). These cover a wide range of care home positions across the UK.",
      },
      {
        q: "Do I need experience to apply?",
        a: "While experience is preferred, it's not always essential. Many of our partner care homes offer training programmes. A genuine passion for care work and the right attitude are highly valued.",
      },
      {
        q: "Can I apply from outside the UK?",
        a: "Yes! We support international applicants through the Health and Care Worker visa route. We work with employers who hold valid sponsor licences to help you relocate to the UK.",
      },
      {
        q: "What qualifications do I need?",
        a: "Requirements vary by role. Generally, a Care Certificate or NVQ Level 2/3 in Health & Social Care is beneficial. For senior roles, NVQ Level 3 and supervisory experience are usually required.",
      },
      {
        q: "How long does the application process take?",
        a: "UK-based applicants typically hear back within 3–5 working days. For international applicants requiring visa sponsorship, the full process including visa processing can take 8–12 weeks.",
      },
      {
        q: "Is there a fee to apply?",
        a: "No, our services are completely free for job seekers. We never charge workers any recruitment fees.",
      },
    ],
  },
  {
    category: "Visa & Sponsorship",
    items: [
      {
        q: "What is the Health and Care Worker visa?",
        a: "It's a UK visa route for qualified health and care professionals. It offers reduced visa fees, exemption from the Immigration Health Surcharge, and a faster processing time compared to other work visas.",
      },
      {
        q: "What are the requirements for a Health and Care Worker visa?",
        a: "You need a job offer from a licensed sponsor, your role must be on the eligible occupations list (our SOC codes qualify), you must meet the minimum salary threshold, and you need to prove your English language ability.",
      },
      {
        q: "Can my family come with me to the UK?",
        a: "Yes, Health and Care Worker visa holders can bring dependants (spouse/partner and children under 18) to the UK. They will also be exempt from the Immigration Health Surcharge.",
      },
      {
        q: "Can I switch to a different visa or settle permanently?",
        a: "Yes, after 5 years on a Health and Care Worker visa, you can apply for Indefinite Leave to Remain (settlement). You can also switch to other visa categories if eligible.",
      },
    ],
  },
  {
    category: "For Care Homes",
    items: [
      {
        q: "How does your recruitment process work?",
        a: "We source, screen, and present qualified candidates for your vacancies. You can post positions through our platform, and we handle the initial vetting including DBS checks and qualification verification.",
      },
      {
        q: "Do you help with visa sponsorship for international staff?",
        a: "Yes, we guide care homes through the entire sponsorship process, from obtaining a sponsor licence to issuing Certificates of Sponsorship and supporting visa applications.",
      },
      {
        q: "What areas of the UK do you cover?",
        a: "We recruit nationwide across England, Scotland, Wales, and Northern Ireland. Our network covers both urban centres and rural communities.",
      },
    ],
  },
];

const FAQPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-hero py-12">
          <div className="container">
            <h1 className="font-heading text-3xl font-bold text-hero-foreground">Frequently Asked Questions</h1>
            <p className="text-hero-foreground/70 mt-2">Find answers to common questions about working in UK care homes</p>
          </div>
        </div>

        <div className="container py-10 max-w-3xl">
          {faqs.map((section, si) => (
            <div key={si} className="mb-10">
              <h2 className="font-heading text-xl font-semibold mb-4">{section.category}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.items.map((faq, fi) => (
                  <AccordionItem key={fi} value={`${si}-${fi}`} className="bg-card border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="bg-secondary rounded-lg p-8 text-center space-y-4 mt-6">
            <h3 className="font-heading text-lg font-semibold">Still have questions?</h3>
            <p className="text-sm text-muted-foreground">Our team is happy to help. Get in touch and we'll respond promptly.</p>
            <Link to="/contact">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Contact Us</Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default FAQPage;
