import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";
import { createClient } from '@/lib/supabase/server'

// GET - Fetch a specific integration's API key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceName: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serviceName: serviceNameParam } = await params
    const serviceName = decodeURIComponent(serviceNameParam)

    // Find user in Prisma database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch the integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId: dbUser.id,
        serviceName: serviceName,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      serviceName: integration.serviceName,
      apiKey: integration.apiKey,
      isActive: integration.isActive,
    })
  } catch (error: any) {
    console.error('Error fetching integration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}
