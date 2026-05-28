import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { codeBlock, oneLine } from 'common-tags'
import { encode } from 'gpt-tokenizer'
import { streamText, embedMany } from 'ai'
import { openai as openaiSdk } from '@ai-sdk/openai'
import { ApplicationError, UserError } from '@/lib/errors'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const runtime = 'edge'

export default async function handler(req: NextRequest) {
  try {
    if (!supabaseUrl) {
      throw new ApplicationError('Missing environment variable SUPABASE_URL')
    }

    if (!supabaseServiceKey) {
      throw new ApplicationError('Missing environment variable SUPABASE_SERVICE_ROLE_KEY')
    }

    const requestData = await req.json()

    if (!requestData) {
      throw new UserError('Missing request data')
    }

    const { messages } = requestData

    const input = messages[messages.length - 1].content

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const moderationResponse = await openai.moderations.create({ input }).catch((error) => {
      throw new ApplicationError('Moderation error', error)
    })

    const [results] = moderationResponse.results

    if (results.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: results.categories,
      })
    }

    // Create embedding from query
    const embeddingModel = openaiSdk.embedding('text-embedding-ada-002')
    const chunks = [input.replaceAll('\n', ' ')]
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks,
    })

    const embedding = embeddings[0]

    const { error: matchError, data: pageSections } = await supabaseClient.rpc(
      'match_page_sections',
      {
        embedding,
        match_threshold: 0.78,
        match_count: 10,
        min_content_length: 50,
      }
    )

    if (matchError) {
      throw new ApplicationError('Failed to match page sections', matchError)
    }

    let tokenCount = 0
    let contextText = ''

    for (let i = 0; i < pageSections.length; i++) {
      const pageSection = pageSections[i]
      const content = pageSection.content
      const encoded = encode(content)
      tokenCount += encoded.length

      if (tokenCount >= 1500) {
        break
      }

      contextText += `${content.trim()}\n---\n`
    }

    const prompt = codeBlock`
      ${oneLine`
        You are a very enthusiastic Supabase representative who loves
        to help people! Given the following sections from the Supabase
        documentation, answer the question using only that information,
        outputted in markdown format. If you are unsure and the answer
        is not explicitly written in the documentation, say
        "Sorry, I don't know how to help with that."
      `}

      Context sections:
      ${contextText}

      Question: """
      ${input}
      """

      Answer as markdown (including related code snippets if available):
    `

    const result = streamText({
      model: openaiSdk('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        ...messages,
      ],
      temperature: 0,
    })

    return result.toDataStreamResponse()
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }

    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
