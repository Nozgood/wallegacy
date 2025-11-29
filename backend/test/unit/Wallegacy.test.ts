import hre from "hardhat";
import { Wallegacy } from "../../types/ethers-contracts/Wallegacy.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";

const { ethers, networkHelpers } = await hre.network.connect();

describe("Wallegacy Create Will", async function() {
    let wallegacy: Wallegacy;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;

    beforeEach(async function () {
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        await wallegacy.waitForDeployment();
    })

    describe("when no address is provided", function() {
        it("should revert with a custom error", async function() {
            await expect(wallegacy.connect(testator).createWill([]))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoHeirs");
        })
    })

    describe("when only one heir is provided and one has address not set", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: ethers.ZeroAddress, percent: 100 }
            ]
            await expect(wallegacy.connect(testator).createWill(heirs))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__HeirWithoutAddress").withArgs(0);
        })
    })

    describe("when the total percent is not equal to 100", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 100 },
                {heirAddress: heirOne, percent: 100 }
            ]
            await expect(wallegacy.connect(testator).createWill(heirs))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NewWillNotGoodPercent").withArgs(200);
        })
    })

    describe("when all parameters are correctly set", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 50 },
                {heirAddress: heirOne, percent: 50 }
            ]
            await expect(wallegacy.connect(testator).createWill(heirs))
            .to.emit(wallegacy, "WillCreated");
        })
    })
})

describe("Wallegacy GetWillByTestator", async function() {
    let wallegacy: Wallegacy;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;

    beforeEach(async function () {
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        await wallegacy.waitForDeployment();
    })

    describe("when no will are created", function(){
        it("should reverts with custom error", async function() {
            await expect(wallegacy.getWillByTestator()).
            to.be.revertedWithCustomError(wallegacy, "Wallegacy__WillNotFound").withArgs(testator)            
        })
    })

    describe("when a will is created", function(){
        beforeEach(async function () {
             const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 50 },
                {heirAddress: heirOne, percent: 50 }
            ]

            await wallegacy.connect(testator).createWill(heirs)
        })

        it("should reverts with custom error", async function() {
            const will = await wallegacy.connect(testator).getWillByTestator();
            expect(will.testator).to.equal(testator);
            expect(will.heirs.length).to.equal(2);
        })
    })
})