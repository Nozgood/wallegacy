# Wallegacy

**⚠️ Disclaimer**: This project is currently in development and deployed on testnet only. Do not use with real funds on mainnet without thorough auditing.

> Digital inheritance system on blockchain - Create testaments as NFTs and distribute assets through smart contracts

🌐 **Live App:** [wallegacy.vercel.app](https://wallegacy.vercel.app/)

## 📋 Overview

Wallegacy is a decentralized application (DApp) enabling testators to create blockchain-based wills represented as Soulbound Tokens (SBTs). The system facilitates secure asset distribution to heirs through smart contracts, with notaries managing the testament lifecycle.

### Key Features

- **Testament as NFT**: Each will is represented by a non-transferable Soulbound Token
- **Pull-over-Push Pattern**: Heirs actively claim their inheritance for enhanced security
- **Multi-Role System**: Testators, Notaries, and Heirs with distinct permissions
- **Gas Optimized**: Custom errors, efficient array operations, CEI pattern
- **Full Transparency**: All operations on-chain, verifiable and immutable

## 🏗️ Architecture

See: [docs/](./docs/schema_fonctionnel_c4_wallegacy.pdf)

### Smart Contracts

- **Wallegacy.sol**: Core inheritance logic, fund management, and will lifecycle
- **WallegacySBT.sol**: Soulbound Token (non-transferable ERC721) representing testaments

## 🛠️ Tech Stack

**Backend:**
- Hardhat 3 (Solidity development framework)
- Solidity 0.8.30 (viaIR compilation)
- OpenZeppelin Contracts (secure implementations)
- Ethers.js v6 (blockchain interaction)

**Frontend:**
- Next.js 16 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- RainbowKit (wallet connection)
- wagmi (React hooks for Ethereum)

**Security & Testing:**
- Mocha + Chai (testing framework)
- Hardhat Coverage (code coverage)
- Slither (static analysis)

## 📦 Installation

### Prerequisites

- Node.js >= 18
- npm or yarn
- MetaMask or compatible wallet

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/wallegacy.git
cd wallegacy

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

**NOTE:** in the frontend/ you will need to edit  `lib/config.ts` to use the network you want

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PK=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

If you aim to use the app only locally, you can edit `hardhat.config.ts` file and remove sepolia settings

**NOTE**: The PK env variable aims to be removed and to use hardhat keystore tool instead

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

## 🚀 Usage

### Running Tests

```bash
cd backend
npx hardhat test mocha --coverage --gas-stats
```

### Local Development

```bash
# Terminal 1 - Start local Hardhat node
cd backend
npx hardhat node

# Terminal 2 - Deploy contracts locally
# NOTE: very important to use --build-profile flag with default to enable viaIR compilation
npx hardhat ignition deploy ignition/modules/Wallegacy.ts --network localhost --build-profile default

# Terminal 3 - Start frontend
cd frontend
npm run dev
```

Navigate to `http://localhost:3000`

### Deploying to Sepolia

```bash
cd backend
npx hardhat ignition deploy ignition/modules/Wallegacy.ts --network sepolia --build-profile default
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

You can also directly use the `--verify` flag on ignition command

## 📝 Contract Addresses

### Sepolia Testnet

| Contract | Address | Etherscan |
|----------|---------|-----------|
| Wallegacy | `0xe793326BC9b25041b12343E638D982089d079AdC` | [View](https://sepolia.etherscan.io/address/0xe793326BC9b25041b12343E638D982089d079AdC) |
| WallegacySBT | `0x0806152905784C1420F5561f1B6AB073F97e1FE5` | [View](https://sepolia.etherscan.io/address/0x0806152905784C1420F5561f1B6AB073F97e1FE5) |

## 📊 Gas Statistics

| Function | Min | Average | Max |
|----------|-----|---------|-----|
| registerNotary | 53,005 | 53,008 | 53,017 |
| newWill | 194,022 | 227,937 | 231,022 |
| setUpWill | 157,195 | 200,961 | 260,641 |
| claimLegacy | 68,234 | 72,889 | 85,679 |
| cancelWill | 89,233 | 103,658 | 118,082 |
| triggerLegacyProcess | 69,023 | 89,106 | 122,577 |

**Deployment Costs:**
- Wallegacy: 6,280,118 gas (29KB)
- WallegacySBT: 2,465,462 gas (12KB)

## 🔒 Security Features

- ✅ **Reentrancy Protection**: Checks-Effects-Interactions pattern
- ✅ **Custom Errors**: Gas-efficient error handling
- ✅ **Pull Payment Pattern**: Heirs claim rather than receive
- ✅ **Access Control**: Role-based permissions (Owner, Notary, Testator, Heir)
- ✅ **Soulbound Tokens**: Non-transferable testament representation
- ✅ **Input Validation**: Comprehensive checks on all user inputs
- ✅ **Static Analysis**: Slither security checks in CI/CD

## 📚 Project Structure

```
wallegacy/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── Wallegacy.sol
│   │   └── WallegacySBT.sol
│   ├── test/               # Contract tests
│   ├── scripts/            # Deployment and interaction scripts
│   ├── ignition/           # Hardhat Ignition deployment modules
│   └── hardhat.config.ts   # Hardhat configuration
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   └── providers/      # React context providers
│   ├── hooks/              # Custom React hooks (wagmi)
│   ├── lib/                # Contract ABIs and utilities
│   └── utils/              # Helper functions and constants
└── docs/                   # Documentation and diagrams
```

## 🔗 Links

- **Live App**: [wallegacy.vercel.app](https://wallegacy.vercel.app/)
- **Documentation**: [docs/](./docs/)
- **Etherscan (Sepolia)**: [Wallegacy Contract](https://sepolia.etherscan.io/address/0xe793326BC9b25041b12343E638D982089d079AdC)

## 📧 Contact
For questions or support, please open an issue on GitHub.
