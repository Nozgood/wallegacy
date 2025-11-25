import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { SuccessionPlanCreateInput, TestatorCreateInput } from '../../../../prisma/generated/models';
import { getNotaryId } from '@/app/notary/login/actions';
import { Testator } from '../../../../prisma/generated/client';

// type of Create Succession Plan request
// export type SuccessionPlanCreateInput = {
//   clientAddress: string
//   notaryName: string
//   status: string
//   createdAt: Date | string
//   updatedAt: Date | string
//   deletedAt: Date | string
// }


export async function POST(request: NextRequest) {
  try {
    const createTestatorRequest: TestatorCreateInput = await request.json();
    if (!createTestatorRequest.publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Register testator in DB
    const testator: Testator  = await prisma.testator.create({data: createTestatorRequest});

    const notaryID = await getNotaryId();
    if (notaryID == null) {
      throw new Error("no notaryID provided in cookies") 
    }

    const notary = await prisma.notary.findFirst({
      where: {
        id: notaryID,
      } 
    })

    const successionPlan = await prisma.successionPlan.create({
      data: {
        testatorPublicKey: testator.publicKey,
        notaryUsername: notary.username,
        status: "DRAFT"
      }
    })

    return NextResponse.json(successionPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating new succession plan:', error);
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const notaryID = await getNotaryId();
    if (notaryID == null) {
      throw new Error("no notaryID provided in cookies") 
    }

  const notary = await prisma.notary.findFirst({
      where: {
        id: notaryID,
      } 
    })



    const successionPlans = await prisma.successionPlan.findMany({
      where: {
        notaryUsername: notary.username
      }
    })

    return NextResponse.json(successionPlans, { status: 200 });
  } catch (error) {
    console.error('Error fetching succession plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
//     const clientAddress = searchParams.get('clientAddress');
//     const notaryAddress = searchParams.get('notaryAddress');

//     const where: any = {};
//     if (clientAddress) where.clientAddress = clientAddress;
//     if (notaryAddress) where.notaryAddress = notaryAddress;

//     const successionPlans = await prisma.successionPlan.findMany({
//       where,
//       include: {
//         client: true,
//         notary: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });


// }