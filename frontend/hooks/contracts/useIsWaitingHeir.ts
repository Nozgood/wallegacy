import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useIsWaitingHeir() {
    const { address } = useAccount();

    const { data, isLoading, isError, refetch } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "isWaitingHeir",
        account: address,
    });

    return {
        isWaitingHeir: data as boolean,
        isLoading,
        isError,
        refetch,
    };
}