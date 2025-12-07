// app/notary/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useIsNotary } from "../../../hooks/contracts/useIsNotary";
import { useNewWill } from "../../../hooks/contracts/useNewWill";
import { useState, useEffect } from "react";
import { useGetNotaryWills } from "../../../hooks/contracts/useGetNotaryWills";

const STATUS_LABELS = {
  0: "Brouillon",
  1: "Actif",
  2: "Exécuté",
  3: "Révoqué",
} as const;

export default function NotaryPage() {
  const { address, isConnected } = useAccount();
  const { isNotary, isLoading } = useIsNotary(address);
  const { createWill, isPending, isConfirming, isConfirmed, isError, error } = useNewWill();
  const { wills, refetch: refetchWills, isLoading: isLoadingWills } = useGetNotaryWills();
  const [testatorAddress, setTestatorAddress] = useState<string>("");

  useEffect(() => {
    if (isConfirmed) {
      refetchWills();
    }
  }, [isConfirmed, refetchWills]);

  const handleCreateWill = () => {
    if (testatorAddress && testatorAddress.startsWith("0x")) {
      createWill(testatorAddress as `0x${string}`);
      setTestatorAddress("");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
        <h1 className="text-3xl font-semibold">Espace Notaire</h1>
        <div className="flex flex-col gap-4 items-center">
          <p className="text-gray-600">Connectez votre portefeuille pour continuer</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-end p-6">
          <ConnectButton />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <h1 className="text-3xl font-semibold">Espace Notaire</h1>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (!isNotary) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-end p-6">
          <ConnectButton />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <h1 className="text-3xl font-semibold">Espace Notaire</h1>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-red-600 font-semibold">✗ Accès refusé</p>
            <p className="text-gray-600">Vous n'êtes pas enregistré comme notaire.</p>
            <p className="text-gray-600 text-sm">Contactez l'administrateur pour obtenir l'accès.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-end p-6">
        <ConnectButton />
      </div>
      <div className="flex flex-col items-center gap-8 p-6">
        <h1 className="text-3xl font-semibold">Espace Notaire</h1>

        <div className="flex flex-col gap-4 items-center w-full max-w-md">
          <p className="text-gray-700 font-semibold">Créer un nouveau testament</p>
          <input
            type="text"
            placeholder="Adresse du testateur (0x...)"
            value={testatorAddress}
            onChange={(e) => setTestatorAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateWill}
            disabled={isPending || isConfirming || !testatorAddress}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isPending || isConfirming ? "Création en cours..." : "Créer le testament"}
          </button>
          {isConfirmed && <p className="text-green-600">✓ Testament créé avec succès</p>}
          {isError && <p className="text-red-500 text-sm">{error?.message}</p>}
        </div>

        <div className="w-full max-w-4xl mt-8 pt-8 border-t border-gray-300">
          <h2 className="text-2xl font-semibold mb-4">Mes Testaments</h2>

          {isLoadingWills && <p className="text-gray-600">Chargement...</p>}

          {!isLoadingWills && wills && wills.length === 0 && (
            <p className="text-gray-600">Aucun testament enregistré</p>
          )}

          {!isLoadingWills && wills && wills.length > 0 && (
            <div className="grid gap-4">
              {wills.map((will, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Testateur:</span>
                      <span className="font-mono text-sm">{will.testator}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Statut:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${will.status === 0 ? "bg-yellow-100 text-yellow-800" :
                        will.status === 1 ? "bg-green-100 text-green-800" :
                          will.status === 2 ? "bg-blue-100 text-blue-800" :
                            "bg-red-100 text-red-800"
                        }`}>
                        {STATUS_LABELS[will.status]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Héritiers:</span>
                      <span>{will.heirs.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Gas payé:</span>
                      <span>{will.gasPayed ? "✓ Oui" : "✗ Non"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}