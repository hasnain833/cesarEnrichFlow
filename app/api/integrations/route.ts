import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../Backend/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all integrations for the authenticated user
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
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || null,
        },
      })
    }

    // Fetch all integrations for this user
    const integrations = await prisma.integration.findMany({
      where: { userId: dbUser.id },
    })
    
    // Map to response format (exclude apiKey for security)
    const safeIntegrations = integrations.map((integration) => ({
      id: integration.id,
      serviceName: integration.serviceName,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }))

    return NextResponse.json({ integrations: safeIntegrations })
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST - Create or update an integration
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
    const { serviceName, apiKey } = body

    if (!serviceName || !apiKey) {
      return NextResponse.json(
        { error: 'serviceName and apiKey are required' },
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

    // Check if this API key is already used by another user
    const existingKey = await prisma.integration.findFirst({
      where: {
        apiKey: apiKey,
        serviceName: serviceName,
        userId: {
          not: dbUser.id, // Exclude current user
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (existingKey) {
      return NextResponse.json(
        {
          error: 'This API key is already in use by another user',
          details: `The ${serviceName} API key is already registered to another account.`,
        },
        { status: 409 } // 409 Conflict
      )
    }

    // Check if integration exists for this user
    const existing = await prisma.integration.findFirst({
      where: {
        userId: dbUser.id,
        serviceName: serviceName,
      },
    })

    let integration
    if (existing) {
      // Update existing
      integration = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          apiKey: apiKey,
          isActive: true,
        },
      })
    } else {
      // Create new
      integration = await prisma.integration.create({
        data: {
          userId: dbUser.id,
          serviceName: serviceName,
          apiKey: apiKey,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        serviceName: integration.serviceName,
        isActive: integration.isActive,
      },
    })
  } catch (error: any) {
    console.error('Error saving integration:', error)
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    )
  }
}

// DELETE - Remove an integration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceName = searchParams.get('serviceName')

    if (!serviceName) {
      return NextResponse.json(
        { error: 'serviceName is required' },
        { status: 400 }
      )
    }

    // Find user in Prisma database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete the integration
    await prisma.integration.deleteMany({
      where: {
        userId: dbUser.id,
        serviceName: serviceName,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
