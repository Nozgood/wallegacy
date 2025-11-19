"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function TestatorLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      {/* title */}
      <h1 className="text-3xl font-semibold mb-8">Testator Login</h1>

      {/* web3 wallet connection */}
      <div className="p-6 bg-white rounded-xl shadow-md">
        {/* connect wallet button */}
        <ConnectButton />
      </div>
    </div>
  );
}
