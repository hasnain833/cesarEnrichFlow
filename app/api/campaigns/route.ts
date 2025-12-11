import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../Backend/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all campaigns for the authenticated user
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

    // Find or create user in Prisma database
    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      // Create user if doesn't exist (e.g., after email verification)
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || null,
        },
      })
    }

    // Fetch all campaigns for this user
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

// POST - Create a new campaign
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

    // Find or create user in Prisma database
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

    // Get count of existing campaigns for this user to generate name
    const campaignsCount = await prisma.campaign.count({
      where: { userId: dbUser.id },
    })

    // Generate campaign name if not provided (generic name)
    const campaignName = name || `Campaign ${campaignsCount + 1}`

    // Create campaign with static sample data
    const sampleData = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        status: 'Active',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Inc',
        status: 'Pending',
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        company: 'StartupXYZ',
        status: 'Active',
      },
    ]

    const campaign = await prisma.campaign.create({
      data: {
        userId: dbUser.id,
        name: campaignName,
        url: url,
        data: sampleData,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

