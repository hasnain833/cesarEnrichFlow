import { prisma } from './prisma'
import type { Integration, User } from '@prisma/client';


export async function getUserIntegrations(supabaseUserId: string): Promise<Integration[]> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { integrations: true },
  })

  return user?.integrations || []
}


export async function getIntegrationByApiName(
  supabaseUserId: string,
  apiName: string
): Promise<Integration | null> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { integrations: { where: { apiName } } },
  })

  return user?.integrations[0] || null
}


export async function upsertIntegration(
  supabaseUserId: string,
  apiName: string,
  apiKey: string,
  userEmail: string,
  firstName?: string
): Promise<Integration> {
  // First, ensure the user exists
  const user = await prisma.user.upsert({
    where: { supabaseId: supabaseUserId },
    update: {
      email: userEmail,
      firstName: firstName || undefined,
      updatedAt: new Date(),
    },
    create: {
      supabaseId: supabaseUserId,
      email: userEmail,
      firstName: firstName || undefined,
    },
  })

  // Then, upsert the integration
  const integration = await prisma.integration.upsert({
    where: {
      userId_apiName: {
        userId: user.id,
        apiName: apiName,
      },
    },
    update: {
      apiKey: apiKey,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      apiName: apiName,
      apiKey: apiKey,
      isActive: true,
    },
  })

  return integration
}


export async function deleteIntegration(
  supabaseUserId: string,
  apiName: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
  })

  if (!user) {
    return false
  }

  const result = await prisma.integration.deleteMany({
    where: {
      userId: user.id,
      apiName: apiName,
    },
  })

  return result.count > 0
}


export async function getOrCreateUser(
  supabaseUserId: string,
  email: string,
  firstName?: string
): Promise<User> {
  return await prisma.user.upsert({
    where: { supabaseId: supabaseUserId },
    update: {
      email: email,
      firstName: firstName || undefined,
      updatedAt: new Date(),
    },
    create: {
      supabaseId: supabaseUserId,
      email: email,
      firstName: firstName || undefined,
    },
  })
}
