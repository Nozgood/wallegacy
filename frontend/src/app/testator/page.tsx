// app/testator/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useIsTestator } from "../../../hooks/contracts/useIsTestator";
import { useGetWill } from "../../../hooks/contracts/useGetWill";
import { useSetUpWill, HeirInput } from "../../../hooks/contracts/useSetUpWill";
import { useCancelWill } from "../../../hooks/contracts/useCancelWill";

import { useState, useEffect } from "react";
import { BaseError, ContractFunctionRevertedError } from "viem";

const STATUS_LABELS = {
  0: "Brouillon",
  1: "Actif",
  2: "Exécuté",
  3: "Révoqué",
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  "Wallegacy__WillNotFound": "Aucun testament trouvé",
  "Wallegacy__NoHeirs": "Vous devez ajouter au moins un héritier",
  "Wallegacy__NotEnoughAmount": "Le montant doit être supérieur à 0",
  "Wallegacy__TestatorWithoutWill": "Vous n'avez pas de testament",
  "Wallegacy__NewWillNotGoodPercent": "La somme des pourcentages doit être égale à 100%",
  "Wallegacy__HeirWithoutAddress": "L'adresse d'un héritier est invalide",
};

export default function TestatorPage() {
  const { isConnected } = useAccount();
  const { isTestator, isLoading: isLoadingTestator } = useIsTestator();
  const { will, refetch: refetchWill, isLoading: isLoadingWill, isError: isWillError } = useGetWill();
  const { setUpWill, isPending, isConfirming, isConfirmed, isError, error } = useSetUpWill();
  const {
    cancelWill,
    isPending: isCancelPending,
    isConfirming: isCancelConfirming,
    isConfirmed: isCancelConfirmed,
    isError: isCancelError,
    error: cancelError
  } = useCancelWill();

  const [heirs, setHeirs] = useState<HeirInput[]>([{ heirAddress: "" as `0x${string}`, percent: 0 }]);
  const [amount, setAmount] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (isConfirmed || isCancelConfirmed) {
      refetchWill();
    }
  }, [isConfirmed, isCancelConfirmed, refetchWill]);

  const addHeir = () => {
    setHeirs([...heirs, { heirAddress: "" as `0x${string}`, percent: 0 }]);
  };

  const removeHeir = (index: number) => {
    setHeirs(heirs.filter((_, i) => i !== index));
  };

  const updateHeir = (index: number, field: keyof HeirInput, value: string | number) => {
    const newHeirs = [...heirs];
    if (field === "heirAddress") {
      newHeirs[index][field] = value as `0x${string}`;
    } else {
      newHeirs[index][field] = Number(value);
    }
    setHeirs(newHeirs);
  };

  const getTotalPercent = () => {
    return heirs.reduce((sum, heir) => sum + heir.percent, 0);
  };

  const handleSetUpWill = () => {
    const validHeirs = heirs.filter(h => h.heirAddress && h.heirAddress.startsWith("0x"));
    if (validHeirs.length > 0 && amount) {
      setUpWill(validHeirs, amount);
    }
  };

  const handleCancelWill = () => {
    cancelWill();
    setShowCancelConfirm(false);
  };

  const getErrorMessage = (err: typeof error | typeof cancelError): string => {
    if (!err) return "";

    if (err instanceof BaseError) {
      const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);

      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName || "";
        return ERROR_MESSAGES[errorName] || err.shortMessage || err.message;
      }
    }

    return err.shortMessage || err.message;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-100 p-6">
        <h1 className="text-3xl font-semibold">Espace Testateur</h1>
        <div className="flex flex-col gap-4 items-center">
          <p className="text-gray-600">Connectez votre portefeuille pour continuer</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoadingTestator || isLoadingWill) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-end p-6">
          <ConnectButton />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <h1 className="text-3xl font-semibold">Espace Testateur</h1>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (!isTestator) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-end p-6">
          <ConnectButton />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <h1 className="text-3xl font-semibold">Espace Testateur</h1>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-red-600 font-semibold">✗ Accès refusé</p>
            <p className="text-gray-600">Vous n'êtes pas enregistré comme testateur.</p>
            <p className="text-gray-600 text-sm">Contactez un notaire pour créer votre testament.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isWillError) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-end p-6">
          <ConnectButton />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 p-6">
          <h1 className="text-3xl font-semibold">Espace Testateur</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">Aucun testament trouvé pour votre adresse</p>
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
        <h1 className="text-3xl font-semibold">Espace Testateur</h1>

        {will && (
          <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Mon Testament</h2>
              {will.status !== 3 && will.status !== 2 && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  Annuler le testament
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
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
                <span className="font-semibold text-gray-700">Notaire:</span>
                <span className="font-mono text-sm">{will.notary}</span>
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

            {will.heirs.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-3">Liste des héritiers:</h3>
                <div className="space-y-2">
                  {will.heirs.map((heir, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{heir.heirAddress}</span>
                      <span className="font-semibold">{heir.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
              <h3 className="text-xl font-semibold mb-4">Confirmer l'annulation</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir annuler votre testament ? Cette action est irréversible.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCancelWill}
                  disabled={isCancelPending || isCancelConfirming}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {isCancelPending || isCancelConfirming ? "En cours..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCancelConfirmed && (
          <div className="w-full max-w-2xl bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-center">✓ Testament annulé avec succès</p>
          </div>
        )}

        {isCancelError && (
          <div className="w-full max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{getErrorMessage(cancelError)}</p>
          </div>
        )}

        {will && will.status === 0 && (
          <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">Configurer mon testament</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant à verrouiller (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Héritiers
                  </label>
                  <span className={`text-sm font-semibold ${getTotalPercent() === 100 ? "text-green-600" : "text-red-600"}`}>
                    Total: {getTotalPercent()}%
                  </span>
                </div>

                {heirs.map((heir, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={heir.heirAddress}
                      onChange={(e) => updateHeir(index, "heirAddress", e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="%"
                      value={heir.percent || ""}
                      onChange={(e) => updateHeir(index, "percent", e.target.value)}
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {heirs.length > 1 && (
                      <button
                        onClick={() => removeHeir(index)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addHeir}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  + Ajouter un héritier
                </button>
              </div>

              <button
                onClick={handleSetUpWill}
                disabled={isPending || isConfirming || getTotalPercent() !== 100 || !amount}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {isPending || isConfirming ? "Configuration en cours..." : "Valider le testament"}
              </button>

              {isConfirmed && (
                <p className="text-green-600 text-center">✓ Testament configuré avec succès</p>
              )}

              {isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}