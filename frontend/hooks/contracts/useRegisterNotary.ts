// hooks/contracts/useRegisterNotary.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/config";

export function useRegisterNotary() {
    const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const register = (notaryAddress: `0x${string}`) => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "registerNotary",
            args: [notaryAddress],
        });
    };

    return {
        register,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error,
    };
}