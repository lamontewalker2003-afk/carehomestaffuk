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

    // Strict formatting rules — clean prose, no decorative symbols, no em-dashes.
    const STYLE_RULES = `STRICT FORMATTING RULES (must follow exactly):
- Write in clear British English.
- Do NOT use em-dashes (—). Use a comma, full stop, or the word "and" instead.
- Do NOT use the # character anywhere in the output.
- Do NOT use asterisks (*) for emphasis or bullets.
- Do NOT use decorative symbols (✦ ★ ➤ • etc.).
- Use plain bullets with a hyphen and a space ("- ") when listing.
- Do NOT wrap output in markdown code fences.
- No preamble, no closing commentary — return only the requested content.`;

    const system = kind === "cover_letter"
      ? `You are an expert UK career coach who writes tailored, ATS-friendly cover letters for the UK job market.

Return JSON ONLY with this shape:
{
  "greeting": "Dear Hiring Manager,",
  "paragraphs": ["...", "...", "..."],
  "signOff": "Yours sincerely,",
  "signature": "<Full Name>"
}

Requirements:
- 3 to 4 short paragraphs, 280-380 words total.
- Open by naming the role and employer.
- Use 2-3 concrete achievements/skills mapped to the job requirements.
- Mention right-to-work / visa status only when useful (e.g. "I hold a Health and Care Worker visa" or "I am on a Graduate visa and eligible to switch to a Skilled Worker visa").
- End with a clear call to action.

${STYLE_RULES}`
      : `You are an expert UK CV writer. Produce a polished UK-style CV optimised for ATS and UK recruiters.

Return JSON ONLY with this shape:
{
  "name": "Full Name",
  "contact": { "email": "", "phone": "", "city": "", "rightToWork": "" },
  "summary": "2-3 sentence personal profile",
  "skills": ["skill 1", "skill 2", "..."],
  "experience": [
    { "role": "Care Assistant", "company": "Sunrise Care Home", "location": "Manchester", "dates": "Jan 2022 to Present", "bullets": ["bullet 1", "bullet 2"] }
  ],
  "education": [ { "qualification": "NVQ Level 3 Health and Social Care", "institution": "...", "dates": "2021" } ],
  "certifications": ["Care Certificate", "DBS", "First Aid"],
  "languages": ["English (Fluent)"],
  "references": "Available on request"
}

Requirements:
- Concise, results-led bullets starting with strong verbs.
- 4-8 key skills, 3-6 bullets per role.
- For care/healthcare roles, surface Care Certificate, NVQ/QCF, manual handling, safeguarding, dementia care where relevant.
- Omit any object/array that has no real data (return [] or empty string).

${STYLE_RULES}`;

    const user = JSON.stringify(payload || {}, null, 2);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
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
    const raw: string = data?.choices?.[0]?.message?.content || "";
    // Strip any code fences just in case
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let parsed: unknown = null;
    try { parsed = JSON.parse(cleaned); } catch { parsed = null; }

    return new Response(JSON.stringify({ success: true, content: cleaned, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
