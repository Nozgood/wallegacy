import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";

export function useClaimLegacy() {
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

    const claimLegacy = (testatorAddress: `0x${string}`) => {
        writeContract({
            ...WALLEGACY_CONTRACT,
            functionName: "claimLegacy",
            args: [testatorAddress],
            account: address,
        });
    };

    return {
        claimLegacy,
        isPending,
        isConfirming,
        isConfirmed,
        isError: isWriteError || isConfirmError,
        error: writeError || confirmError,
    };
}