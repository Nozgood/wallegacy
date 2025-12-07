// hooks/contracts/useTriggerLegacy.ts
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useTriggerLegacy() {
    const { address } = useAccount();
    const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        isError: isConfirmError,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash,
    });

    const triggerLegacy = (testatorAddress: `0x${string}`) => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "triggerLegacyProcess",
            args: [testatorAddress],
            account: address,
        });
    };

    return {
        triggerLegacy,
        isPending,
        isConfirming,
        isConfirmed,
        isError: isWriteError || isConfirmError,
        error: writeError || confirmError,
    };
}