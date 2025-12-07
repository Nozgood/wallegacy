import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useIsOwner() {
    const { address, isConnected } = useAccount();

    const { data: ownerAddress, isLoading, isError } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "owner",
        query: {
            enabled: isConnected,
        },
    });

    const isOwner = address?.toLowerCase() === ownerAddress?.toLowerCase();

    return {
        isOwner,
        ownerAddress,
        isLoading,
        isError,
    };
}