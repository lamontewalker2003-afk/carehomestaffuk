import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get SMTP settings from database
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

    if (!smtp.host || !smtp.username || !smtp.password) {
      return new Response(JSON.stringify({ error: 'SMTP configuration incomplete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use SMTP to send email via raw socket simulation with fetch to an SMTP relay
    // Since Deno edge functions can't do raw SMTP, we use the MailChannels API (free for edge)
    // Or we construct an email and send via SMTP-over-HTTP bridge
    // For maximum compatibility, use a simple HTTP-based email sending approach

    // Build the email using the SMTP credentials via a base64-encoded auth
    const auth = btoa(`${smtp.username}:${smtp.password}`);
    
    // Try sending via SMTP using Deno's built-in capabilities
    // We'll use a simple approach: connect to the SMTP server
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const conn = await Deno.connect({
      hostname: smtp.host,
      port: smtp.port || 587,
    });

    // If secure/TLS, upgrade connection
    let writer = conn;
    
    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : '';
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    };

    // Read greeting
    await readResponse();
    
    // EHLO
    await sendCommand(`EHLO localhost`);
    
    // STARTTLS if not using SSL
    if (!smtp.secure && smtp.port !== 465) {
      const tlsResp = await sendCommand('STARTTLS');
      if (tlsResp.startsWith('220')) {
        const tlsConn = await Deno.startTls(conn, { hostname: smtp.host });
        // Re-assign for further commands
        const tlsWriter = tlsConn;
        
        const readTls = async (): Promise<string> => {
          const buf = new Uint8Array(4096);
          const n = await tlsConn.read(buf);
          return n ? decoder.decode(buf.subarray(0, n)) : '';
        };
        
        const sendTls = async (cmd: string): Promise<string> => {
          await tlsConn.write(encoder.encode(cmd + '\r\n'));
          return await readTls();
        };
        
        await sendTls('EHLO localhost');
        
        // AUTH LOGIN
        await sendTls('AUTH LOGIN');
        await sendTls(btoa(smtp.username));
        const authResp = await sendTls(btoa(smtp.password));
        
        if (!authResp.includes('235')) {
          tlsConn.close();
          return new Response(JSON.stringify({ error: 'SMTP authentication failed' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        await sendTls(`MAIL FROM:<${smtp.fromEmail}>`);
        await sendTls(`RCPT TO:<${to}>`);
        await sendTls('DATA');
        
        const message = `From: "${smtp.fromName}" <${smtp.fromEmail}>\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`;
        const sendResp = await sendTls(message);
        await sendTls('QUIT');
        tlsConn.close();
        
        return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Direct AUTH for SSL connections
    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(smtp.username));
    const authResp = await sendCommand(btoa(smtp.password));
    
    if (!authResp.includes('235')) {
      conn.close();
      return new Response(JSON.stringify({ error: 'SMTP authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    await sendCommand(`MAIL FROM:<${smtp.fromEmail}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand('DATA');
    
    const message = `From: "${smtp.fromName}" <${smtp.fromEmail}>\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`;
    await sendCommand(message);
    await sendCommand('QUIT');
    conn.close();

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
