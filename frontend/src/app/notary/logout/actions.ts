"use server";

import { cookies } from "next/headers";

export async function logoutNotary() {
    (await cookies()).delete("notary_token");
}