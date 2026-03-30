import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: smtpData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'smtp')
      .single();

    if (!smtpData?.value) {
      return new Response(JSON.stringify({ error: 'SMTP not configured. Please set up SMTP in admin panel.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const smtp = smtpData.value as {
      host: string;
      port: number;
      username: string;
      password: string;
      fromEmail: string;
      fromName: string;
      secure: boolean;
    };

    if (!smtp.host || !smtp.username || !smtp.password || !smtp.fromEmail) {
      return new Response(JSON.stringify({ error: 'SMTP configuration incomplete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: smtp.port || 587,
        tls: smtp.secure,
        auth: {
          username: smtp.username,
          password: smtp.password,
        },
      },
    });

    await client.send({
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
