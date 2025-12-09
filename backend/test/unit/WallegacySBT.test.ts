import hre from "hardhat";
import { Wallegacy } from "../../types/ethers-contracts/Wallegacy.js";
import { WallegacySBT } from "../../types/ethers-contracts/WallegacySBT.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import { Hash } from "crypto";

const { ethers, networkHelpers } = await hre.network.connect();

async function setUpWallegacySBT() {
    const [ownerAddress, testatorAddress, testatorTwoAddress]: HardhatEthersSigner = await ethers.getSigners();
    const wallegacy: Wallegacy = await ethers.deployContract("Wallegacy", ownerAddress);
    const wallegacySBT: WallegacySBT = await ethers.deployContract("WallegacySBT", ["localhost.com", wallegacy]);

    return { ownerAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT }
}

describe("SBT Mint", function () {
    let ownerAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let testatorTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT } = await setUpWallegacySBT());
    })
})
