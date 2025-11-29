import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("WallegacyModule", (m) => {
    const wallegacy = m.contract("Wallegacy")
    return { wallegacy }
})