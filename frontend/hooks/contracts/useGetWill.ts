// hooks/contracts/useGetWill.ts
import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { Will } from "./useGetNotaryWills";

export function useGetWill() {
    const { address, isConnected } = useAccount();

    const { data: will, refetch, isLoading, isError } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "getWill",
        account: address,
        query: {
            enabled: isConnected && !!address,
        },
    });

    return {
        will: will as Will | undefined,
        refetch,
        isLoading,
        isError,
    };
}