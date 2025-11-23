"use client";

import TestatorHeader from "@/components/TestatorHeader";
import { useAccount } from "wagmi";

export default function TestatorLogin() {
  const { isConnected, address } = useAccount();

  return (
    <div className="min-h-screen bg-gray-100">
      <TestatorHeader />

      <main className="flex flex-col items-center justify-center p-6 mt-20">
        <h1 className="text-3xl font-semibold mb-8">Testator Login</h1>

        <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-md text-center">
          {isConnected ? (
            <>
              <p className="mb-4">You are connected!</p>
              <p className="text-sm text-gray-500">Address: {address}</p>
            </>
          ) : (
            <p>Please connect your wallet using the button in the top right.</p>
          )}
        </div>
      </main>
    </div>
  );
}
