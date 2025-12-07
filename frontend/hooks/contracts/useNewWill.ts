// hooks/contracts/useNewWill.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useNewWill() {
    const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const createWill = (testatorAddress: `0x${string}`) => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "newWill",
            args: [testatorAddress],
        });
    };

    return {
        createWill,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error,
    };
}