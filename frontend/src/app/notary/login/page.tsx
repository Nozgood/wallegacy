"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NotaryHeader from "@/components/NotaryHeader";
import { loginNotary } from "./actions";

export default function NotaireLoginPage() {
    const router = useRouter() 
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

  // handleSubmit will be use in the future to call notary auth API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Identifier:", identifier);
    console.log("Password:", password);

    await loginNotary(identifier, password);
   router.push("/notary/space") 
  };

  return ( <>
    <NotaryHeader />
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
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
            Se connecter
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

