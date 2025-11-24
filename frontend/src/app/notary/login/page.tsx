"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NotaryHeader from "@/components/NotaryHeader";
import { loginNotary } from "./actions";

type Notary = {
  id: number;
  username: string;
};

export default function NotaireLoginPage() {
    const router = useRouter() 
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // handleSubmit will be use in the future to call notary auth API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/notary/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const notary: Notary = await response.json();
      

   await loginNotary(notary);
      router.push('/notary/space');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    } 
  };

  return ( <>
    <NotaryHeader showLogout={false} />
<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Espace Notaire
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Identifiant
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Entrez votre identifiant"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Entrez votre mot de passe"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition">
              {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

    </div>
    </>
  );
}

