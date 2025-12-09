import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserIntegrations,
  upsertIntegration,
  deleteIntegration,
} from '../../../Backend/lib/integrations'

// GET - Get all integrations for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await getUserIntegrations(user.id)
    return NextResponse.json({ integrations })
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch integrations' },
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
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiName, apiKey } = body

    if (!apiName || !apiKey) {
      return NextResponse.json(
        { error: 'apiName and apiKey are required' },
        { status: 400 }
      )
    }

    const integration = await upsertIntegration(
      user.id,
      apiName,
      apiKey,
      user.email || '',
      user.user_metadata?.first_name
    )

    return NextResponse.json({ integration })
  } catch (error: any) {
    console.error('Error upserting integration:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save integration' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an integration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const apiName = searchParams.get('apiName')

    if (!apiName) {
      return NextResponse.json(
        { error: 'apiName is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteIntegration(user.id, apiName)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete integration' },
      { status: 500 }
    )
  }
}

