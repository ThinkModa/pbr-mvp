import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailReport {
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'support_request';
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
  deviceInfo?: string;
  appVersion?: string;
  timestamp: string;
  appName: string;
  platform: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, report }: { to: string; report: EmailReport } = await req.json()

    if (!to || !report) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email content
    const emailContent = createEmailContent(report)
    
    // Send email using Supabase's email service
    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: to,
        subject: report.subject,
        html: emailContent.html,
        text: emailContent.text,
        from: 'PBR MVP App <noreply@thinkmodalabs.com>'
      }
    })

    if (error) {
      console.error('Error sending email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the report to database for tracking
    await logReportToDatabase(supabaseClient, report)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data?.messageId || 'unknown' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function createEmailContent(report: EmailReport) {
  const typeLabels = {
    bug_report: '🐛 Bug Report',
    feature_request: '💡 Feature Request', 
    general_feedback: '💬 General Feedback',
    support_request: '🆘 Support Request'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${report.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D29507; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .meta { background: #e8f4f8; padding: 15px; border-radius: 8px; font-size: 14px; }
        .meta-item { margin: 5px 0; }
        .label { font-weight: bold; color: #555; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${typeLabels[report.type]}</h2>
          <p>From PBR MVP Mobile App</p>
        </div>
        <div class="content">
          <div class="message">
            <h3>Message:</h3>
            <p>${report.message.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="meta">
            <div class="meta-item"><span class="label">Type:</span> ${typeLabels[report.type]}</div>
            <div class="meta-item"><span class="label">App:</span> ${report.appName} (${report.platform})</div>
            <div class="meta-item"><span class="label">Version:</span> ${report.appVersion || '1.0.0'}</div>
            <div class="meta-item"><span class="label">Timestamp:</span> ${new Date(report.timestamp).toLocaleString()}</div>
            ${report.userName ? `<div class="meta-item"><span class="label">User:</span> ${report.userName}</div>` : ''}
            ${report.userEmail ? `<div class="meta-item"><span class="label">Email:</span> ${report.userEmail}</div>` : ''}
            ${report.deviceInfo ? `<div class="meta-item"><span class="label">Device:</span> ${report.deviceInfo}</div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
${typeLabels[report.type]} - PBR MVP Mobile App

Message:
${report.message}

Details:
Type: ${typeLabels[report.type]}
App: ${report.appName} (${report.platform})
Version: ${report.appVersion || '1.0.0'}
Timestamp: ${new Date(report.timestamp).toLocaleString()}
${report.userName ? `User: ${report.userName}` : ''}
${report.userEmail ? `Email: ${report.userEmail}` : ''}
${report.deviceInfo ? `Device: ${report.deviceInfo}` : ''}
  `

  return { html, text }
}

async function logReportToDatabase(supabaseClient: any, report: EmailReport) {
  try {
    const { error } = await supabaseClient
      .from('user_reports')
      .insert({
        type: report.type,
        subject: report.subject,
        message: report.message,
        user_email: report.userEmail,
        user_name: report.userName,
        device_info: report.deviceInfo,
        app_version: report.appVersion,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging report to database:', error)
    }
  } catch (error) {
    console.error('Exception logging report to database:', error)
  }
}
