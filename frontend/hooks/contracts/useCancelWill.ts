// hooks/contracts/useCancelWill.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useCancelWill() {
    const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        isError: isConfirmError,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash,
    });

    const cancelWill = () => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "cancelWill",
        });
    };

    return {
        cancelWill,
        isPending,
        isConfirming,
        isConfirmed,
        isError: isWriteError || isConfirmError,
        error: writeError || confirmError,
    };
}