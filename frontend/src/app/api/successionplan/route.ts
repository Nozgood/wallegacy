import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { SuccessionPlanCreateInput } from '../../../../prisma/generated/models';

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
    const body: SuccessionPlanCreateInput = await request.json();
    body.notaryName = "tetedenoeuds"
    body.status = "DRAFT"

    const isoDate = new Date().toISOString();
    // body.createdAt = isoDate
    // body.updatedAt = isoDate
    // body.deletedAt = isoDate
    if (!body.clientAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create succession plan
    const successionPlan = await prisma.successionPlan.create({data: body});
    return NextResponse.json(successionPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating succession plan:', error);
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

//     return NextResponse.json(successionPlans, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching succession plans:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }