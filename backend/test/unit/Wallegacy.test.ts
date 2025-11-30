import hre from "hardhat";
import { Wallegacy } from "../../types/ethers-contracts/Wallegacy.js";
import { WallegacySBT } from "../../types/ethers-contracts/WallegacySBT.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";

const { ethers, networkHelpers } = await hre.network.connect();

describe("Wallegacy setSBTContract", async function () {
    let wallegacy: Wallegacy;
    let sbtContract: WallegacySBT;

    beforeEach(async function () {
        wallegacy = await ethers.deployContract("Wallegacy");
    })

    describe("when the sbt is not deployed", function () {
        it("should reverts with WallegacySBT__NoAddress error", async function () {
            await expect(wallegacy.setSBTContract(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(wallegacy, "WallegacySBT__NoAddress")
        })
    })

    describe("when the sbt is deployed", function () {
        beforeEach(async function () {
            sbtContract = await ethers.deployContract("WallegacySBT", ["Wallegacy SBT", "WLSBT", "localhost.com", wallegacy.getAddress()]);
        })


        it("should assign sbt variable to deployed contract and emit event", async function () {
            await expect(wallegacy.setSBTContract(sbtContract.getAddress()))
                .to.emit(wallegacy, "SBTContractSet").withArgs(sbtContract.getAddress())
        })
    })
})

describe("Wallegacy createWill", async function () {
    let wallegacy: Wallegacy;
    let sbtContract: WallegacySBT;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;
    let depositAmount: bigint;

    beforeEach(async function () {
        depositAmount = ethers.parseEther("2.0");
        [testator, heirOne, heirTwo] = await ethers.getSigners();

        wallegacy = await ethers.deployContract("Wallegacy");
        sbtContract = await ethers.deployContract("WallegacySBT", ["Wallegacy SBT", "WLSBT", "localhost.com", wallegacy.getAddress()]);

        await wallegacy.waitForDeployment();
        await sbtContract.waitForDeployment();

    })

    describe("when the SBT is not set", function() {
        it("should reverts immediatly", async function () {
            await expect(wallegacy.connect(testator).createWill([]))
                .to.be.revertedWithCustomError(wallegacy, "WallegacySBT__NotSet")
        })
    })

    describe("when the SBT contract is set", function() {
        beforeEach(async function () {
            await wallegacy.setSBTContract(sbtContract);
        })

        describe("when the testator has already created a will", function () {
            beforeEach(async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOne, percent: 100 },
                ]

                await wallegacy.connect(testator).createWill(heirs, { value: depositAmount })
            })

            it("should reverts with Wallegacy__TestatorAlreadyHasWill error", async function () {
                await expect(wallegacy.connect(testator).createWill([]))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__TestatorAlreadyHasWill");
            })
        })

        describe("when no heirs is provided", function () {
            it("should revert with a Wallegacy__NoHeirs error", async function () {
                await expect(wallegacy.connect(testator).createWill([]))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoHeirs");
            })
        })

        describe("when no ETH is sent", function () {
            it("should revert with a Wallegacy__NotEnoughAmount error", async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: ethers.ZeroAddress, percent: 100 }
                ]

                await expect(wallegacy.connect(testator).createWill(heirs))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NotEnoughAmount");
            })
        })

        describe("when only one heir is provided and address is null", function () {
            it("should revert with a Wallegacy__HeirWithoutAddress error", async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: ethers.ZeroAddress, percent: 100 }
                ]


                await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__HeirWithoutAddress").withArgs(0);
            })
        })

        describe("when the total percent is not equal to 100", function () {
            it("should revert with a Wallegacy__NewWillNotGoodPercent error", async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOne, percent: 100 },
                    { heirAddress: heirOne, percent: 100 }
                ]
                await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NewWillNotGoodPercent").withArgs(200);
            })
        })

        describe("when all parameters are correctly set", function () {
            it("should emit all the events and should not revert", async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOne, percent: 50 },
                    { heirAddress: heirOne, percent: 50 }
                ]
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy.target);


                expect(await sbtContract.balanceOf(testator.address)).to.equal(0);

                await expect(wallegacy.connect(testator).createWill(heirs, { value: depositAmount }))
                    .to.emit(wallegacy, "TestatorValueLocked").withArgs(testator.address, depositAmount)
                    .and.to.emit(sbtContract, "SBTMinted")
                    .and.to.emit(wallegacy, "WillCreated");

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy.target);
                expect(contractBalanceAfter - contractBalanceBefore).to.equal(depositAmount)
                const isTestator = await wallegacy.connect(testator).isTestator()
                expect(isTestator).to.equal(true);

                expect(await sbtContract.balanceOf(testator.address)).to.equal(1);
            })
        })
    })

})

describe("Wallegacy getWill", async function () {
    let wallegacy: Wallegacy;
    let sbtContract: WallegacySBT;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;

    beforeEach(async function () {
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        await wallegacy.waitForDeployment();



    })

    describe("when no will are created", function () {
        it("should reverts with Wallegacy__NoTestator error", async function () {
            await expect(wallegacy.getWill()).
                to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoTestator")
        })
    })

    describe("when a will is created", function () {
        beforeEach(async function () {
            const heirs: Wallegacy.HeirStruct[] = [
                { heirAddress: heirOne, percent: 50 },
                { heirAddress: heirTwo, percent: 50 }
            ]

            const depositAmout = ethers.parseEther("2.0")
            sbtContract = await ethers.deployContract("WallegacySBT", ["Wallegacy SBT", "WLSBT", "localhost", wallegacy.getAddress()])
            await sbtContract.waitForDeployment();
            await wallegacy.setSBTContract(sbtContract);
            await wallegacy.connect(testator).createWill(heirs, { value: depositAmout })
        })

        it("should returns the will corresponding to the testator", async function () {
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
    let sbtContract: WallegacySBT;
    let testator: HardhatEthersSigner;
    let heirOne: HardhatEthersSigner;
    let heirTwo: HardhatEthersSigner;

    beforeEach(async function () {
        [testator, heirOne, heirTwo] = await ethers.getSigners();
        wallegacy = await ethers.deployContract("Wallegacy");
        sbtContract = await ethers.deployContract("WallegacySBT", ["Wallegacy SBT", "WLSBT", "localhost", wallegacy.getAddress()])
        await wallegacy.setSBTContract(sbtContract);
        await wallegacy.waitForDeployment();
        const heirs: Wallegacy.HeirStruct[] = [
            { heirAddress: heirOne, percent: 50 },
            { heirAddress: heirOne, percent: 50 }
        ]

        const depositAmout = ethers.parseEther("2.0")
        await wallegacy.connect(testator).createWill(heirs, { value: depositAmout })
    })

    describe("the testator has not created a Will", function () {
        it("should returns 0", async function () {
            const valueLocked = await wallegacy.connect(heirOne).getLockedValue();
            expect(valueLocked).to.equal(0);
            expect(valueLocked).to.equal(ethers.parseEther("0"));
        })
    })
})