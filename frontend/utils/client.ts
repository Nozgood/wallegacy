import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";


// viemPublicClient is used to get the logs (the events) of the smart contract
export const viemPublicClient = createPublicClient({
    chain: hardhat,
    transport: http(),
})