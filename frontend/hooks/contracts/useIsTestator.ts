// hooks/contracts/useIsTestator.ts
import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useIsTestator() {
    const { address, isConnected } = useAccount();

    const { data: isTestator, refetch, isLoading, isError } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "isTestator",
        account: address,
        query: {
            enabled: isConnected && !!address,
        },
    });

    return {
        isTestator: isTestator ?? false,
        refetch,
        isLoading,
        isError,
    };
}