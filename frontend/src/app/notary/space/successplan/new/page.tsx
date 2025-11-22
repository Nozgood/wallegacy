"use client";
import { useState } from 'react';
import NotaryHeader from '@/components/NotaryHeader';

export default function SuccessionPlanForm() {
  const [clientAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEthereumAddress = (address: string) => {
    // Check if address starts with 0x and has 42 characters total (0x + 40 hex chars)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  };

  const validateAddress = (address: string) => {
    if (!address) {
      return 'L\'adresse du portefeuille est requise';
    }
    if (!isValidEthereumAddress(address)) {
      return 'Adresse Ethereum invalide';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate address
    const validationError = validateAddress(clientAddress);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // API call to save to database
      const response = await fetch('/api/successionplan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientAddress: clientAddress }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du plan');
      }

      setSuccess(true);
      setWalletAddress('');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressChange = (e: React.InputEvent) => {
    const value = e.target.value.trim();
    setWalletAddress(value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  return (
    <>
 <NotaryHeader />
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Créer un Plan de Succession
          </h1>
          <p className="text-slate-600 mb-8">
            Étape 1 : Saisir l'adresse du bénéficiaire
          </p>

          <div>
            <div className="mb-6">
              <label 
                htmlFor="walletAddress" 
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Adresse du Portefeuille (0x...)
              </label>
              <input
                type="text"
                id="walletAddress"
                value={clientAddress}
                onChange={handleAddressChange}
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors font-mono text-sm ${
                  error 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-slate-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Plan de succession créé avec succès !
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer le Plan'
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              L'adresse doit être une adresse Ethereum valide commençant par 0x
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
   
  );
}