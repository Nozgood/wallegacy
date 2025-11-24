"use server";

import { cookies } from "next/headers";
import { Notary } from "../../../../prisma/generated/client";

export async function loginNotary(notary: Notary) {
    // TODO: call the Notary API to login


    (await cookies()).set("notary_id", notary.id.toString(), {
       httpOnly: true,
       secure: true,
       path: "/",
       maxAge: 60 * 60 * 24, // 24hours
    })
}

// TODO: move this function in a correct file
export async function getNotaryId(): Promise<number | null> {
  const cookieStore = await cookies();
  const notaryId = cookieStore.get("notary_id")?.value;
  return notaryId ? parseInt(notaryId) : null;
}