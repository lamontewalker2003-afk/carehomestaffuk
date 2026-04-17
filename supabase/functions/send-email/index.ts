import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always respond with 200 + JSON envelope so the client can parse error payloads
function respond(success: boolean, payload: Record<string, unknown> = {}, status = 200) {
  return new Response(JSON.stringify({ success, ...payload }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, replyTo } = await req.json();

    if (!to || !subject || !html) {
      return respond(false, { error: 'Missing required fields: to, subject, html' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: smtpRow } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'smtp')
      .maybeSingle();

    const smtp = smtpRow?.value as {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      fromEmail?: string;
      fromName?: string;
      secure?: boolean;
    } | null;

    if (!smtp || !smtp.host || !smtp.username || !smtp.password || !smtp.fromEmail) {
      return respond(false, { error: 'SMTP not configured. Please set up SMTP in the admin panel.' });
    }

    const { data: siteRow } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'site_settings')
      .maybeSingle();

    const siteName = (siteRow?.value as any)?.siteName || smtp.fromName || 'CareHomeStaffUK';

    const port = Number(smtp.port) || 587;
    // Port 465 = implicit TLS (secure: true). Port 587/25 = STARTTLS (secure: false)
    const useImplicitTLS = port === 465 || smtp.secure === true;

    const buildTransport = (opts: { secure: boolean; requireTLS: boolean; ignoreTLS?: boolean }) =>
      nodemailer.createTransport({
        host: smtp.host,
        port,
        secure: opts.secure,
        requireTLS: opts.requireTLS,
        ignoreTLS: opts.ignoreTLS,
        auth: { user: smtp.username, pass: smtp.password },
        tls: {
          // Shared-hosting SMTP servers (cPanel/Plesk/mail.yourdomain.com)
          // often have self-signed or hostname-mismatched certs.
          rejectUnauthorized: false,
          servername: smtp.host,
          minVersion: 'TLSv1',
          ciphers: 'DEFAULT@SECLEVEL=0',
        },
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
      });

    // Primary attempt: implicit TLS for 465, STARTTLS for everything else
    let transporter = buildTransport({
      secure: useImplicitTLS,
      requireTLS: !useImplicitTLS,
    });

    // Plain-text fallback for inbox deliverability
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const fromName = (smtp.fromName || siteName).replace(/[<>"]/g, '');

    const info = await transporter.sendMail({
      from: { name: fromName, address: smtp.fromEmail },
      to,
      subject,
      text,
      html,
      replyTo: replyTo || undefined,
      headers: {
        'X-Mailer': siteName,
        'List-Unsubscribe': `<mailto:${smtp.fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log('Email sent:', info.messageId, 'to', to);
    return respond(true, { messageId: info.messageId, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send error:', error?.message || error, error?.stack);
    return respond(false, { error: error?.message || 'Failed to send email' });
  }
});
