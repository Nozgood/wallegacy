"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useRouter } from "next/navigation";

export default function TestatorHeader() {
  const router = useRouter();

  return (
    <header className="w-full flex justify-between p-4 bg-white shadow-md">
       <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Home
      </button>
      <ConnectButton />
    </header>
  );
}