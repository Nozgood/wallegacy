"use server";

import { cookies } from "next/headers";

export async function loginNotary(identifier: string, password: string) {
    // TODO: call the Notary API to login


    (await cookies()).set("notary_token", "fake_jwt_token", {
       httpOnly: true,
       secure: true,
       path: "/",
       maxAge: 60 * 60 * 24, // 24hours
    })
}