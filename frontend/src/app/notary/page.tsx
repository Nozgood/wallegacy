// app/notary/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useIsNotary } from "../../../hooks/contracts/useIsNotary";

export default function NotaryPage() {
  const { address, isConnected } = useAccount();
  const { isNotary, isLoading } = useIsNotary(address);

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
      <div className="flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-3xl font-semibold">Espace Notaire</h1>
        <p className="text-green-600 font-semibold">✓ Bienvenue, vous êtes enregistré comme notaire</p>
      </div>
    </div>
  );
}