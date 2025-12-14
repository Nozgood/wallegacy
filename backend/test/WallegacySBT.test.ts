import hre from "hardhat";
import { Wallegacy } from "../types/ethers-contracts/Wallegacy.js";
import { WallegacySBT } from "../types/ethers-contracts/WallegacySBT.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import { Hash } from "crypto";

const { ethers, networkHelpers } = await hre.network.connect();

async function setUpWallegacySBT() {
    const [ownerAddress, notaryAddress, testatorAddress, testatorTwoAddress]: HardhatEthersSigner[] = await ethers.getSigners();
    const wallegacy: Wallegacy = await ethers.deployContract("Wallegacy", ownerAddress);
    const wallegacySBT: WallegacySBT = await ethers.deployContract("WallegacySBT", ["localhost.com", wallegacy]);

    return { ownerAddress, notaryAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT }
}

describe("SBT Mint", function () {
    let ownerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let testatorTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notaryAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT } = await setUpWallegacySBT());
        await wallegacy.setSBTContract(wallegacySBT);
    })

    describe("not wallegacy who calls the mint", function () {
        it("should reverts with SBT__NoWallegacyContract", async function () {
            await expect(wallegacySBT.mint(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(wallegacySBT, "SBT__NoWallegacyContract");
        })
    })

    describe("mint with address 0", function () {
        it("should reverts with custom error on balance checking", async function () {
            const wallegacySigner = await ethers.getImpersonatedSigner(await wallegacy.getAddress());
            await expect(wallegacySBT.connect(wallegacySigner).mint(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(wallegacySBT, "ERC721InvalidOwner");
        })
    })

    describe("normal process", function () {
        it("should emit event", async function () {
            await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
            await wallegacy.connect(notaryAddress).newWill(testatorAddress)

            const wallegacySigner = await ethers.getImpersonatedSigner(await wallegacy.getAddress());
            await expect(wallegacySBT.connect(wallegacySigner).mint(testatorAddress.address))
                .to.be.revertedWithCustomError(wallegacySBT, "SBT__TestatorAlreadyHasSBT")
        })
    })
})

describe("SBT Burn", function () {
    let ownerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let testatorTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notaryAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT } = await setUpWallegacySBT());
    })

    describe("trying to burn non existent sbt", function () {
        it("should reverts with custom error", async function () {
            const wallegacySigner = await ethers.getImpersonatedSigner(await wallegacy.getAddress());
            await expect(wallegacySBT.connect(wallegacySigner).burn(testatorAddress))
                .to.be.revertedWithCustomError(wallegacySBT, "SBT_NoSBTFound")
        })
    })
})

describe("SBT Transfer protection", function () {
    let ownerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let testatorTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notaryAddress, testatorAddress, testatorTwoAddress, wallegacy, wallegacySBT } = await setUpWallegacySBT());


        await wallegacy.setSBTContract(wallegacySBT);
        await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
        await wallegacy.connect(notaryAddress).newWill(testatorAddress)
    })

    it("should revert when trying to transfer SBT", async function () {
        const wallegacySigner = await ethers.getImpersonatedSigner(await wallegacy.getAddress());

        await expect(
            wallegacySBT.connect(wallegacySigner).transferFrom(
                testatorAddress.address,
                testatorTwoAddress.address,
                BigInt(testatorAddress.address)
            )
        ).to.be.revertedWithCustomError(wallegacySBT, "SBT__TransferNotAllowed");
    })

    it("should revert when trying to safeTransfer SBT", async function () {
        const wallegacySigner = await ethers.getImpersonatedSigner(await wallegacy.getAddress());

        const tokenId = BigInt(testatorAddress.address);

        await expect(
            wallegacySBT.connect(testatorAddress)["safeTransferFrom(address,address,uint256)"](
                testatorAddress.address,
                testatorTwoAddress.address,
                tokenId
            )
        ).to.be.revertedWithCustomError(wallegacySBT, "SBT__TransferNotAllowed");
    })
})