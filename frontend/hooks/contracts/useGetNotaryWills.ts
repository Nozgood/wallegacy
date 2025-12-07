// hooks/contracts/useNotaryWills.ts
import { useReadContract, useAccount } from "wagmi";
import { WALLEGACY_CONTRACT } from "../../lib/contracts/config";
import { Address } from "viem";

export type WillStatus = 0 | 1 | 2 | 3; // DRAFT, ACTIVE, EXECUTED, REVOKED

export interface Heir {
    heirAddress: Address;
    share: bigint;
}

export interface Will {
    testator: Address;
    status: WillStatus;
    gasPayed: boolean;
    exists: boolean;
    heirs: Heir[];
    notary: Address;
}

export function useGetNotaryWills() {
    const { address, isConnected } = useAccount();

    const { data: wills, refetch, isLoading, isError } = useReadContract({
        ...WALLEGACY_CONTRACT,
        functionName: "getNotaryWills",
        query: {
            enabled: isConnected && !!address,
        },
        account: address,
    });

    return {
        wills: wills as Will[] | undefined,
        refetch,
        isLoading,
        isError,
    };
}