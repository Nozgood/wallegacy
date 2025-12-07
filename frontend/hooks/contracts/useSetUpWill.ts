// hooks/contracts/useSetUpWill.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { parseEther } from "viem";

export interface HeirInput {
    heirAddress: `0x${string}`;
    percent: number;
}

export function useSetUpWill() {
    const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        isError: isConfirmError,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash,
    });

    const setUpWill = (heirs: HeirInput[], amountInEth: string) => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "setUpWill",
            args: [heirs],
            value: parseEther(amountInEth),
        });
    };

    return {
        setUpWill,
        isPending,
        isConfirming,
        isConfirmed,
        isError: isWriteError || isConfirmError,
        error: writeError || confirmError,
    };
}