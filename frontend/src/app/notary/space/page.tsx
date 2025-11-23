"use client";

import NotaryHeader from "@/components/NotaryHeader";
import { useRouter } from "next/navigation";

export default function NotaryPage() {
    const router = useRouter()
  return <>
  <NotaryHeader />
  <h1>Welcome on your Notary Space</h1>
      <button
        onClick={() => router.push("/notary/space/successplan/new")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Nouveau plan de succession
      </button>


  </>
}