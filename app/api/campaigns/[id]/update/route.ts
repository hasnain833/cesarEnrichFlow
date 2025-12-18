import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    const expectedApiKey = process.env.N8N_API_KEY

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    const campaign = await prisma.campaign.findUnique({
      where: { id: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (status) {
      updateData.status = status
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

