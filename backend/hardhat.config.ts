import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import "dotenv/config"

const ALCHEMY_SEPOLIA_URL = process.env.ALCHEMY_SEPOLIA_URL || "";
const PK = process.env.PK || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
        settings: {
          viaIR: true,
        },
      },
      production: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: ALCHEMY_SEPOLIA_URL,
      accounts: [PK],
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY
    }
  }
});
