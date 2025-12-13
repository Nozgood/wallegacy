// app/heir/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useIsWaitingHeir } from "../../../hooks/contracts/useIsWaitingHeir";
import { useClaimLegacy } from "../../../hooks/contracts/useClaimLegacy";
import { useState, useEffect } from "react";
import { BaseError, ContractFunctionRevertedError } from "viem";

const ERROR_MESSAGES: Record<string, string> = {
    "Wallegacy__NoLegacy": "Aucun legs disponible pour cette adresse",
    "Wallegacy__ErrorSendingLegacy": "Erreur lors de l'envoi du legs",
};

export default function HeirPage() {
    const { address, isConnected } = useAccount();
    const { isWaitingHeir, isLoading, refetch } = useIsWaitingHeir();
    const {
        claimLegacy,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error
    } = useClaimLegacy();

    const [testatorAddress, setTestatorAddress] = useState<string>("");
    const [confirmClaim, setConfirmClaim] = useState<boolean>(false);

    useEffect(() => {
        if (isConfirmed) {
            refetch();
            setTestatorAddress("");
        }
    }, [isConfirmed, refetch]);

    const handleClaimLegacy = () => {
        if (testatorAddress && testatorAddress.startsWith("0x")) {
            claimLegacy(testatorAddress as `0x${string}`);
            setConfirmClaim(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
                <h1 className="text-3xl font-semibold">Espace Héritier</h1>
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
                    <h1 className="text-3xl font-semibold">Espace Héritier</h1>
                    <p className="text-gray-600">Vérification en cours...</p>
                </div>
            </div>
        );
    }

    if (!isWaitingHeir) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="flex justify-end p-6">
                    <ConnectButton />
                </div>
                <div className="flex flex-col items-center justify-center gap-6 p-6">
                    <h1 className="text-3xl font-semibold">Espace Héritier</h1>
                    <div className="flex flex-col gap-4 items-center">
                        <p className="text-red-600 font-semibold">✗ Accès refusé</p>
                        <p className="text-gray-600">Vous n'êtes pas enregistré comme héritier en attente de legs.</p>
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
                <h1 className="text-3xl font-semibold">Espace Héritier</h1>

                {isConfirmed && (
                    <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-600 text-center">✓ Legs réclamé avec succès</p>
                    </div>
                )}

                {isError && (
                    <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error?.message}</p>
                    </div>
                )}

                <div className="flex flex-col gap-4 items-center w-full max-w-md">
                    <p className="text-gray-700 font-semibold">Réclamer votre legs</p>
                    <p className="text-gray-600 text-sm text-center">
                        Entrez l'adresse du testateur pour réclamer votre part d'héritage
                    </p>
                    <input
                        type="text"
                        placeholder="Adresse du testateur (0x...)"
                        value={testatorAddress}
                        onChange={(e) => setTestatorAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => setConfirmClaim(true)}
                        disabled={isPending || isConfirming || !testatorAddress}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                        Réclamer le legs
                    </button>
                </div>
            </div>

            {confirmClaim && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Confirmer la réclamation</h3>
                        <p className="text-gray-600 mb-2">
                            Vous êtes sur le point de réclamer votre legs du testateur :
                        </p>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded mb-4 break-all">
                            {testatorAddress}
                        </p>
                        <p className="text-gray-600 text-sm mb-6">
                            Les fonds seront transférés sur votre portefeuille.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmClaim(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleClaimLegacy}
                                disabled={isPending || isConfirming}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {isPending || isConfirming ? "En cours..." : "Confirmer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
