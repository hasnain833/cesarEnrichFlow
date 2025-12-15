import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../Backend/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || null,
        },
      })
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, name } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || null,
        },
      })
    }

    const campaignsCount = await prisma.campaign.count({
      where: { userId: dbUser.id },
    })

    const campaignName = name || `Campaign ${campaignsCount + 1}`

    const campaign = await prisma.campaign.create({
      data: {
        userId: dbUser.id,
        name: campaignName,
        url: url,
        status: 'pending',
      },
    })

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const apiKey = process.env.N8N_API_KEY

    try {
      if (!webhookUrl) {
        console.error('N8N_WEBHOOK_URL environment variable is not set')
        return NextResponse.json({
          success: true,
          campaign: {
            ...campaign,
            warning: 'n8n webhook URL is not configured',
          },
        })
      }

      if (!apiKey) {
        console.error('N8N_API_KEY environment variable is not set')
        return NextResponse.json({
          success: true,
          campaign: {
            ...campaign,
            warning: 'n8n API key is not configured',
          },
        })
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'processing' },
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (process.env.N8N_AUTH_TYPE === 'bearer') {
        headers["Authorization"] = `Bearer ${apiKey}`
      } else {
        headers["x-api-key"] = apiKey
      }

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          campaignId: String(campaign.id), 
          userId: String(dbUser.id),
          apolloUrl: campaign.url
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!webhookResponse.ok) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'pending' },
        })

        const errorText = await webhookResponse.text().catch(() => 'No error details')
        const statusCode = webhookResponse.status

        throw new Error(`n8n webhook failed: ${webhookResponse.statusText} (${statusCode})${errorText ? ` - ${errorText}` : ''}`)
      }

      return NextResponse.json({
        success: true,
        campaign: {
          ...campaign,
          status: 'processing',
        },
      })
    } catch (webhookError: any) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'pending' },
      })

      return NextResponse.json({
        success: true,
        campaign: {
          ...campaign,
          status: 'pending',
        },
      })
    }
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
