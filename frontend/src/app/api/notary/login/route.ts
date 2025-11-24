// src/app/api/notary/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

type LoginRequestBody = {
  username: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();

    if (!body.username || body.username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Try to find existing notary or create new one
    const notary = await prisma.notary.upsert({
      where: { username: body.username },
      update: {}, // No update needed if exists
      create: { username: body.username }
    });

    return NextResponse.json(notary, { status: 200 });
  } catch (error) {
    console.error('Error during notary login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}