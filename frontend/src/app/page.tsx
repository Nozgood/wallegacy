// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold">Welcome</h1>
      <button
        onClick={() => router.push("/admin")}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Admin
      </button>
      <button
        onClick={() => router.push("/notary")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Notaire
      </button>

      <button
        onClick={() => router.push("/testator")}
        className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Testateur
      </button>
      <button
        onClick={() => router.push("/heir")}
        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Heritier
      </button>
    </div>
  );
}

