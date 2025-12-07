// app/admin/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRegisterNotary } from "../../../hooks/contracts/useRegisterNotary";
import { useIsNotary } from "../../../hooks/contracts/useIsNotary";
import { useState } from "react";
import { useIsOwner } from "../../../hooks/contracts/useIsOwner";

export default function AdminPage() {
    const { isConnected } = useAccount();
    const { isOwner, isLoading: isCheckingOwner } = useIsOwner();
    const { register, isPending, isConfirming, isConfirmed, isError, error } = useRegisterNotary();
    const [notaryAddress, setNotaryAddress] = useState<string>("");
    const [checkAddress, setCheckAddress] = useState<string>("");
    const [addressToCheck, setAddressToCheck] = useState<`0x${string}` | undefined>(undefined);

    const { isNotary, isLoading: isCheckingNotary } = useIsNotary(addressToCheck);

    const handleRegister = () => {
        if (notaryAddress && notaryAddress.startsWith("0x")) {
            register(notaryAddress as `0x${string}`);
            setNotaryAddress("");
        }
    };

    const handleCheck = () => {
        if (checkAddress && checkAddress.startsWith("0x")) {
            setAddressToCheck(checkAddress as `0x${string}`);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
                <h1 className="text-3xl font-semibold">Espace Admin</h1>
                <div className="flex flex-col gap-4 items-center">
                    <p className="text-gray-600">Connectez votre portefeuille pour continuer</p>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    if (isCheckingOwner) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="flex justify-end p-6">
                    <ConnectButton />
                </div>
                <div className="flex flex-col items-center justify-center gap-6 p-6">
                    <h1 className="text-3xl font-semibold">Espace Admin</h1>
                    <p className="text-gray-600">Vérification en cours...</p>
                </div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="flex justify-end p-6">
                    <ConnectButton />
                </div>
                <div className="flex flex-col items-center justify-center gap-6 p-6">
                    <h1 className="text-3xl font-semibold">Espace Admin</h1>
                    <div className="flex flex-col gap-4 items-center">
                        <p className="text-red-600 font-semibold">✗ Accès refusé</p>
                        <p className="text-gray-600">Vous n'êtes pas autorisé à accéder à cet espace.</p>
                        <p className="text-gray-600 text-sm">Seul le propriétaire du contrat peut accéder à cette page.</p>
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
                <h1 className="text-3xl font-semibold">Espace Admin</h1>

                <div className="flex flex-col gap-4 items-center w-full max-w-md">
                    <p className="text-gray-700 font-semibold">Enregistrer un notaire</p>
                    <input
                        type="text"
                        placeholder="Adresse du notaire (0x...)"
                        value={notaryAddress}
                        onChange={(e) => setNotaryAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleRegister}
                        disabled={isPending || isConfirming || !notaryAddress}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                        {isPending || isConfirming ? "Enregistrement en cours..." : "Enregistrer"}
                    </button>
                    {isConfirmed && <p className="text-green-600">✓ Notaire enregistré avec succès</p>}
                    {isError && <p className="text-red-500 text-sm">{error?.message}</p>}
                </div>

                <div className="flex flex-col gap-4 items-center w-full max-w-md mt-8 pt-8 border-t border-gray-300">
                    <p className="text-gray-700 font-semibold">Vérifier un notaire</p>
                    <input
                        type="text"
                        placeholder="Adresse à vérifier (0x...)"
                        value={checkAddress}
                        onChange={(e) => setCheckAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleCheck}
                        disabled={!checkAddress || isCheckingNotary}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                        {isCheckingNotary ? "Vérification..." : "Vérifier"}
                    </button>
                    {addressToCheck && !isCheckingNotary && (
                        <p className={`font-semibold ${isNotary ? "text-green-600" : "text-red-600"}`}>
                            {isNotary ? "✓ Cette adresse est un notaire enregistré" : "✗ Cette adresse n'est pas un notaire"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}