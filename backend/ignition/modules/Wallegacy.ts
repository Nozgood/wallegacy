import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("WallegacyModule", (m) => {
    // hardhat public key 19 (the last)
    const staticRelayerAddress = "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
    const wallegacy = m.contract("Wallegacy", [staticRelayerAddress]);
    const sbtContract = m.contract("WallegacySBT", ["localhost", wallegacy])

    m.call(wallegacy, "setSBTContract", [sbtContract])


    return { wallegacy, sbtContract }
})