"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutNotary() {
    (await cookies()).delete("notary_id");
    redirect("/notary/login")
}