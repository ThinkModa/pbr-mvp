import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationData {
  notification_id: string
  user_id: string
  title: string
  body: string
  data?: any
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

    // Get the notification data from the request
    const { notification_id, user_id, title, body, data } = await req.json() as PushNotificationData

    console.log('📱 Sending push notification:', { notification_id, user_id, title, body })

    // Get user's push tokens
    const { data: pushTokens, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('push_token, platform')
      .eq('user_id', user_id)

    if (tokensError) {
      console.error('❌ Error fetching push tokens:', tokensError)
      throw new Error(`Failed to fetch push tokens: ${tokensError.message}`)
    }

    if (!pushTokens || pushTokens.length === 0) {
      console.log('⚠️ No push tokens found for user:', user_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No push tokens found for user',
          user_id 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send push notification via Expo
    const expoPushMessages = pushTokens.map(token => ({
      to: token.push_token,
      title,
      body,
      data: {
        ...data,
        notification_id,
        user_id
      },
      sound: 'default',
      priority: 'high',
      channelId: 'default'
    }))

    console.log('📤 Sending to Expo Push API:', expoPushMessages.length, 'tokens')

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushMessages)
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('❌ Expo Push API error:', errorText)
      throw new Error(`Expo Push API error: ${expoResponse.status} ${errorText}`)
    }

    const expoResult = await expoResponse.json()
    console.log('✅ Expo Push API response:', expoResult)

    // Update notification status
    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notification_id)

    if (updateError) {
      console.error('⚠️ Error updating notification status:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent successfully',
        expo_result: expoResult,
        tokens_sent: pushTokens.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
