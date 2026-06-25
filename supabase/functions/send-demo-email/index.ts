import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// Use the admin email from secrets, or fallback to the hardcoded email
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'saikrishna.veeramreddi@gmail.com'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // Webhook payloads from Supabase are typically sent directly if it's a raw HTTP request 
    // or as a record payload. In our SQL function, we formatted it like:
    // { "fullName": "...", "email": "...", "schoolName": "...", "mobileNumber": "..." }
    const { fullName, email, schoolName, mobileNumber } = payload

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set")
    }

    // Email for the Admin
    const htmlContent = `
      <h2>New Demo Request: MDJ SpaceVanta</h2>
      <p>A new school has requested a demo!</p>
      <ul>
        <li><strong>Name:</strong> ${fullName}</li>
        <li><strong>Requester Email:</strong> ${email}</li>
        <li><strong>School:</strong> ${schoolName}</li>
        <li><strong>Mobile:</strong> ${mobileNumber}</li>
      </ul>
      <p>Please reach out to them to schedule their demo.</p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MDJ SpaceVanta <hello@mdjspacevanta.online>',
        to: ADMIN_EMAIL, 
        reply_to: email, // This allows you to just hit "Reply" in Gmail and it goes to the requester
        subject: `New Demo Request from ${schoolName}`,
        html: htmlContent,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(`Resend Error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify({ message: "Email sent successfully", data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending demo email:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
