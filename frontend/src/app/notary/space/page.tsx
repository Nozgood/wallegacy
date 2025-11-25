"use client";

import NotaryHeader from "@/components/NotaryHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotaryPage() {
    const router = useRouter()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
      const fetchPlans = async () => {
        try {
          const listPlansResponse = await fetch("/api/successionplan", {
              method: "GET",
              headers: {
                'Content-Type': 'application/json',
              },

          })
if (!listPlansResponse.ok) throw new Error("Erreur serveur");
        
        const data = await listPlansResponse.json();
        console.log(data)
        setPlans(data);
        } catch(err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
      
      fetchPlans()
    }, [])


  if (loading) return <p>loading ...</p>
  if (error) return <p>error: {error}</p>
    
  return <>
  <NotaryHeader />
  <h1>Welcome on your Notary Space</h1>
<ul>
        {plans.map(plan => (
          <li key={plan.id}>
            {plan.testatorPublicKey} — {plan.status}
          </li>
        ))}
      </ul>
      <button
        onClick={() => router.push("/notary/space/successplan/new")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Nouveau plan de succession
      </button>


  </>
}