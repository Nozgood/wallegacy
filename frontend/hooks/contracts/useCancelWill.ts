// hooks/contracts/useCancelWill.ts
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { BaseError, ContractFunctionRevertedError } from "viem";

export function useCancelWill() {
    const { writeContract, data: hash, isPending, isError: isWriteError, error: writeError } = useWriteContract();
    const { address } = useAccount();

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
            account: address,
        });
    };

    const getErrorMessage = (): string | null => {
        const error = writeError || confirmError;
        if (!error) return null;

        if (error instanceof BaseError) {
            const revertError = error.walk(err => err instanceof ContractFunctionRevertedError);
            if (revertError instanceof ContractFunctionRevertedError) {
                const errorName = revertError.data?.errorName ?? '';
                const args = revertError.data?.args ?? [];
                return `${errorName}(${args.join(', ')})`;
            }
        }

        return error.message;
    };

    return {
        cancelWill,
        isPending,
        isConfirming,
        isConfirmed,
        isError: isWriteError || isConfirmError,
        errorMessage: getErrorMessage(),
    };
}