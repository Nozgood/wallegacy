import { Address } from "viem";
import { CONTRACT_ADDRESS } from "../constants";
import WallegacyABI from "../../backend/artifacts/contracts/Wallegacy.sol/Wallegacy.json";

export const WALLEGACY_CONTRACT = {
    address: CONTRACT_ADDRESS as Address,
    abi: WallegacyABI.abi,
} as const;

// Types declaration accorded to smart contract

export enum WillStatus {
    DRAFT = 0,
    SAVED = 1,
    DONE = 2,
    CANCELLED = 3,
}

export interface Heir {
    heirAddress: Address;
    percent: number;
}

export interface Will {
    testator: Address;
    status: WillStatus;
    gasPayed: boolean;
    exists: boolean;
    heirs: Heir;
}