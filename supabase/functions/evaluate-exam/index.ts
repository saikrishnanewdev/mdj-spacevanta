import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client, handle_file } from "npm:@gradio/client"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { q_url, m_url, s_url, level } = await req.json()

    if (!q_url || !m_url || !s_url || !level) {
      throw new Error("Missing required parameters: q_url, m_url, s_url, level")
    }

    const HF_TOKEN = Deno.env.get('HF_TOKEN')
    
    if (!HF_TOKEN) {
      throw new Error("Server configuration error: Missing HF_TOKEN secret")
    }

    const spaceName = Deno.env.get('HF_SPACE_NAME') || "NBLVPrasad/ExamEvaluationSystem_Pdf_Version2"
    const client = await Client.connect(spaceName, {
      token: HF_TOKEN
    })

    const predictResult = await client.predict(1, [
      handle_file(q_url),
      handle_file(m_url),
      handle_file(s_url),
      level
    ])

    if (!predictResult || !predictResult.data) {
      throw new Error("Invalid output received from the AI evaluation space.")
    }

    return new Response(
      JSON.stringify(predictResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})
