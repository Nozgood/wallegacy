"use client";

import TestatorHeader from "@/components/TestatorHeader";
import { useAccount  } from "wagmi";
import { useState } from "react";
import { useCreateWill, useGetWill } from "../../../hooks/useWallegacy";
import { Heir } from "../../../lib/contract";
import { Address } from "viem";

export default function TestatorLogin() {
  const { isConnected, address } = useAccount();
  console.log(address)
  const { createWill, isPending, isConfirming, isSuccess, error } = useCreateWill();
  const { data: existingWill, isLoading, refetch } = useGetWill(address);

  console.log(existingWill)

  const [heir, setHeir] = useState<Heir>({ heirAddress: "" as Address, percent: 100 })

  const handleCreateWill = () => {
    createWill(heir);
  }

  if (isLoading) return <p>loading ...</p>

  return (
    <div className="min-h-screen bg-gray-100">
      <TestatorHeader />

      <main className="flex flex-col items-center justify-center p-6 mt-20">
        <h1 className="text-3xl font-semibold mb-8">Testator Dashboard</h1>

        <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-2xl">
          {!isConnected ? (
            <p className="text-center">Please connect your wallet using the button in the top right.</p>
          ) : existingWill?.exists ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Will</h2>
              <p>Status: {existingWill.status}</p>
              <p>Gas Payed: {existingWill.gasPayed ? "Yes" : "No"}</p>
              <p>Heirs: {existingWill.heirs}</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Create Your Will</h2>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Heir address (0x...)"
                    value={heir.heirAddress}
                    onChange={(e) => setHeir({heirAddress: e.target.value as Address, percent: heir.percent })}
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="%"
                    value={heir.percent}
                    onChange={(e) => setHeir({heirAddress: heir.heirAddress, percent: Number(e.target.value)})}
                    className="w-20 px-3 py-2 border rounded"
                    min="0"
                    max="100"
                  />
                </div>
              <button
                onClick={handleCreateWill}
                disabled={isPending || isConfirming}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded disabled:bg-gray-400"
              >
                {isPending || isConfirming ? "Creating..." : "Create Will"}
              </button>

              {isSuccess && (
                <p className="mt-4 text-green-600">Will created successfully!</p>
              )}

              {error && (
                <p className="mt-4 text-red-600">Error: {error.message}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}