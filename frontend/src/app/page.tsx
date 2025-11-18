// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold">Welcome</h1>

      <button
        onClick={() => router.push("/notaire-login")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        {/* redirects to notary login */}
        Notaire
      </button>

      <button
        onClick={() => router.push("/client-login")}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        {/* redirects to client login */}
        Client
      </button>
    </div>
  );
}

