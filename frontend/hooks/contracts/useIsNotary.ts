// hooks/contracts/useIsNotary.ts
import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { Address } from "viem";

export function useIsNotary(address: Address | undefined) {
    const { data: isNotary, refetch, isLoading, isError } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "isNotary",
        args: address ? [address] : undefined,
    });

    return {
        isNotary: isNotary ?? false,
        refetch,
        isLoading,
        isError,
    }
}