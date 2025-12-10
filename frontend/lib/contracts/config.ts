import { Address } from "viem";
import WallegacyABI from "../../../backend/artifacts/contracts/Wallegacy.sol/Wallegacy.json";

export const WALLEGACY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const OWNER_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

export const WALLEGACY_CONTRACT = {
    address: WALLEGACY_ADDRESS as Address,
    abi: WallegacyABI.abi,
} as const;
