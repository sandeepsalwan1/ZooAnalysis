import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { frames } = await req.json() as { frames?: string[] }
  if (!frames || frames.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing frames' }), { status: 400 })
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const content: OpenAI.ChatCompletionContentPart[] = [
    { type: 'text', text: 'You are an animal behaviorist. Provide a narrative of activity, subtle illness signs, overall health assessment (movement, social interaction, physical form, coat/skin), and actionable recommendations. Do not mention frames.' },
    ...frames.slice(0, 24).map((dataUrl) => ({
      type: 'image_url',
      image_url: { url: dataUrl, detail: 'low' as const },
    }))
  ]

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'user', content }
  ]

  const result = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 900,
  })

  const report = result.choices?.[0]?.message?.content || ''
  return new Response(JSON.stringify({ report }), { status: 200, headers: { 'content-type': 'application/json' } })
}

