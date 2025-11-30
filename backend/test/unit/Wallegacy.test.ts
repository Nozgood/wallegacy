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
    let depositAmount: bigint;

    beforeEach(async function () {
        depositAmount = ethers.parseEther("2.0");
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        await wallegacy.waitForDeployment();
    })

    describe("when no heirs is provided", function() {
        it("should revert with a custom error", async function() {
            await expect(wallegacy.connect(testator).createWill([]))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoHeirs");
        })
    })

    describe("when no ETH is sent", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: ethers.ZeroAddress, percent: 100 }
            ]

            await expect(wallegacy.connect(testator).createWill(heirs))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NotEnoughAmount");
        })
    })

    describe("when only one heir is provided and one has address not set", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: ethers.ZeroAddress, percent: 100 }
            ]


            await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__HeirWithoutAddress").withArgs(0);
        })
    })

    describe("when the total percent is not equal to 100", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 100 },
                {heirAddress: heirOne, percent: 100 }
            ]
            await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NewWillNotGoodPercent").withArgs(200);
        })
    })

    describe("when all parameters are correctly set", function() {
        it("should revert with a custom error", async function() {
            const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 50 },
                {heirAddress: heirOne, percent: 50 }
            ]
            const contractBalanceBefore = await ethers.provider.getBalance(wallegacy.target);

            await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
            .to.emit(wallegacy, "WillCreated");

            const contractBalanceAfter = await ethers.provider.getBalance(wallegacy.target);
            expect(contractBalanceAfter - contractBalanceBefore).to.equal(depositAmount)
        })
    })
})

describe("Wallegacy getWill", async function() {
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
            await expect(wallegacy.getWill()).
            to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoTestator")            
        })
    })

    describe("when a will is created", function(){
        beforeEach(async function () {
             const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 50 },
                {heirAddress: heirTwo, percent: 50 }
            ]

            const depositAmout = ethers.parseEther("2.0")

            await wallegacy.connect(testator).createWill(heirs, { value: depositAmout })
        })

        it("should returns the will corresponding to the testator", async function() {
            const will = await wallegacy.connect(testator).getWill();
            expect(will.testator).to.equal(testator);
            expect(will.heirs.length).to.equal(2);
            expect(will.exists).to.equal(true);
            expect(will.heirs[0].heirAddress).to.equal(heirOne);
            expect(will.heirs[1].heirAddress).to.equal(heirTwo);
        })
    })
})

describe("Wallegacy getValueLocked", async function () {
    let wallegacy: Wallegacy;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;

    beforeEach(async function () {
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        await wallegacy.waitForDeployment();
        const heirs: Wallegacy.HeirStruct[] = [
                {heirAddress: heirOne, percent: 50 },
                {heirAddress: heirOne, percent: 50 }
        ]

        const depositAmout = ethers.parseEther("2.0")
        await wallegacy.connect(testator).createWill(heirs, { value: depositAmout })
    })

    describe("the testator has not created a Will",function () {
        it("should returns 0",async function () {
            const valueLocked = await wallegacy.connect(heirOne).getLockedValue(); 
            expect(valueLocked).to.equal(0);
            expect(valueLocked).to.equal(ethers.parseEther("0"));
        }) 
    })
})