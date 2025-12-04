import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("WallegacyModule", (m) => {
    const wallegacy = m.contract("Wallegacy");
    const sbtContract = m.contract("WallegacySBT", ["localhost", wallegacy])

    m.call(wallegacy, "setSBTContract", [sbtContract])


    return { wallegacy, sbtContract }
})