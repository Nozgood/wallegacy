import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { formatEther } from "viem";

export function useGetLockedValue() {
    const { address } = useAccount();

    const { data, isLoading, isError, refetch } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "getLockedValue",
        args: [address],
        account: address,
    });

    return {
        lockedValue: data as bigint,
        lockedValueFormatted: data ? formatEther(data as bigint) : "0",
        isLoading,
        isError,
        refetch,
    };
}