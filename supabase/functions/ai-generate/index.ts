// Public AI generation endpoint (guest-friendly).
// Uses Lovable AI Gateway. No JWT required (verify_jwt = false).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kind, payload } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "AI key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = kind === "cover_letter"
      ? `You are an expert UK career coach who writes tailored, ATS-friendly cover letters for the UK job market.
- Write in clear British English.
- 280-380 words, 3-4 short paragraphs, polite confident tone.
- Open by naming the role and employer.
- Use 2-3 concrete achievements/skills from the applicant's background mapped to the job requirements.
- Mention right-to-work / visa status only if useful (e.g. "I hold a Health & Care Worker visa" / "I am on a Graduate visa and eligible to switch to a Skilled Worker visa").
- End with a clear call to action and "Yours sincerely, <Full Name>".
Return ONLY the letter body (no markdown fences, no preamble).`
      : `You are an expert UK CV writer. Produce a polished UK-style CV in clean Markdown for ATS systems and UK recruiters.
- British English, concise, results-led bullets starting with strong verbs.
- Sections in this order (omit any with no data): Personal Profile, Key Skills, Work Experience, Education & Qualifications, Certifications, Languages, Right to Work / Visa Status, References.
- Use ## for section headings, ### for job titles, bullets with "-".
- Top of CV: name as # heading, then contact line (email • phone • city, UK).
- 1-2 pages worth of content.
- For care/healthcare roles, surface Care Certificate, NVQ/QCF, manual handling, safeguarding, dementia care.
Return ONLY the CV markdown (no preamble).`;

    const user = JSON.stringify(payload || {}, null, 2);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit reached. Please try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please contact the site admin." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ success: false, error: `AI gateway error: ${t.slice(0, 300)}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
