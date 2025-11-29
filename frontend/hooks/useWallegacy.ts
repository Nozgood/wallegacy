import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { WALLEGACY_CONTRACT } from "../lib/contract";
import { Heir, Will } from "../lib/contract";
import { Address } from "viem";
import { parseAbiItem } from "viem";

export function useCreateWill() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
 
    const createWill = (heir: Heir) => {
        writeContract({
            ...WALLEGACY_CONTRACT, 
            functionName: "createWill",
            args: [heir],
        })
    }

    return {
        createWill,
        hash,
        isPending, 
        isConfirming,
        isSuccess,
        error
    }
} 

export function useGetWill(testatorAddress: Address) {
    return useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "getWillByTestator",
        args: [testatorAddress],
        query: {},
    }) as {
        data: Will | undefined;
        isLoading: boolean;
        error: Error | null;
        refetch: () => void;
    }
}