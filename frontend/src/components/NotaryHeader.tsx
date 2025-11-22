"use client";
import { useRouter } from "next/navigation";
import { logoutNotary } from "@/app/notary/logout/actions";

interface NotaryHeaderProps {
  showLogout?: boolean;
}

export default function NotaryHeader({showLogout = true}: NotaryHeaderProps) {
  const router = useRouter();

  return (
    <header className="w-full flex p-4 bg-white shadow-md">
       <button
        onClick={() => router.push("/notary/space")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Home
      </button>

      {showLogout && (<button onClick={() => logoutNotary()}>
        Logout
      </button>)}
      
    </header>
  );
}