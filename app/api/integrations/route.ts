import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";
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

    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {},
      create: {
        supabaseId: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.first_name || null,
      },
    })

    const integrations = await prisma.integration.findMany({
      where: { userId: dbUser.id },
    })

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

    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {},
      create: {
        supabaseId: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.first_name || null,
      },
    })

    const existingKey = await prisma.integration.findFirst({
      where: {
        apiKey: apiKey,
        serviceName: serviceName,
        userId: {
          not: dbUser.id,
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
        { status: 409 }
      )
    }

    const existing = await prisma.integration.findFirst({
      where: {
        userId: dbUser.id,
        serviceName: serviceName,
      },
    })

    let integration
    if (existing) {
      integration = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          apiKey: apiKey,
          isActive: true,
        },
      })
    } else {
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

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
