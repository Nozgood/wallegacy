import hre from "hardhat";
import { Wallegacy } from "../../types/ethers-contracts/Wallegacy.js";
import { WallegacySBT } from "../../types/ethers-contracts/WallegacySBT.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";
import { exec } from "child_process";

const { ethers, networkHelpers } = await hre.network.connect();

async function setUpWallegacy() {
    const [ownerAddress, notOwnerAddress, notaryAddress, anotherNotaryAddress, heirOneAddress, heirTwoAddress, heirThreeAddress, testatorAddress]: HardhatEthersSigner = await ethers.getSigners();
    const wallegacy: Wallegacy = await ethers.deployContract("Wallegacy", ownerAddress);
    const wallegacySBT: WallegacySBT = await ethers.deployContract("WallegacySBT", ["localhost.com", wallegacy]);

    return { ownerAddress, notOwnerAddress, notaryAddress, anotherNotaryAddress, heirOneAddress, heirTwoAddress, heirThreeAddress, testatorAddress, wallegacy, wallegacySBT }
}

describe("Wallegacy setSBTContract", function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, heirOneAddress, heirTwoAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
    });

    describe("when the sbt is not deployed", function () {
        it("should reverts with WallegacySBT__NoAddress error", async function () {
            await expect(wallegacy.setSBTContract(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(wallegacy, "WallegacySBT__NoAddress")
        })
    })

    describe("when the sbt is deployed", function () {
        it("should assign sbt variable to deployed contract and emit event", async function () {
            await expect(wallegacy.setSBTContract(wallegacySBT))
                .to.emit(wallegacy, "SBTContractSet").withArgs(wallegacySBT)
        })
    })
})

describe("Wallegacy registerNotary", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
    });

    describe("when the function caller is not the owner", function () {
        it("should reverts with OwnableUnauthorizedAccount error ", async function () {
            await expect(wallegacy.connect(notOwnerAddress).registerNotary(notaryAddress))
                .to.be.revertedWithCustomError(wallegacy, "OwnableUnauthorizedAccount").withArgs(notOwnerAddress);
        })
    })

    describe("when the caller is the owner", function () {
        it("should register the notary and emit event", async function () {
            await expect(wallegacy.connect(ownerAddress).registerNotary(notaryAddress))
                .to.emit(wallegacy, "NotaryRegistered").withArgs(notaryAddress);

            const isNotary = await wallegacy.connect(ownerAddress).isNotary(notaryAddress);
            expect(isNotary).to.be.equal(true);
        })
    })
})

describe("Wallegacy newWill", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, heirOneAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
    });

    describe("when the notary is not registered", function () {
        it("should reverts with Unauthorized error", async function () {
            await expect(wallegacy.connect(ownerAddress).newWill(heirOneAddress))
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__Unauthorized");
        })
    })

    describe("when the notary is registered", function () {
        beforeEach(async () => {
            await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
        })

        it("should register new will and emit event", async function () {
            await expect(wallegacy.connect(notaryAddress).newWill(heirOneAddress))
                .to.emit(wallegacy, "NotaryNewWill").withArgs(notaryAddress, heirOneAddress)
                .and.to.emit(wallegacy, "TestatorRegistered").withArgs(heirOneAddress)
                .and.to.emit(wallegacy, "NotaryAddWill").withArgs(notaryAddress);

            const isTestator = await wallegacy.connect(heirOneAddress).isTestator();
            expect(isTestator).to.be.equal(true);
        })

        it("should reverts if the testator already have one Will", async function () {
            await expect(wallegacy.connect(notaryAddress).newWill(heirOneAddress))
                .to.emit(wallegacy, "NotaryNewWill").withArgs(notaryAddress, heirOneAddress);

            await expect(wallegacy.connect(notaryAddress).newWill(heirOneAddress))
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__WillAlreadySet").withArgs(heirOneAddress);
        })
    })
})

describe("Wallegacy setUpWill", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;
    const depositAmount = ethers.parseEther("2.0");

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, heirOneAddress, heirTwoAddress, testatorAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
        await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
    });

    describe("when the SBT is not set", function () {
        it("should reverts with WallegacySBT__NotSet error", async function () {
            await expect(wallegacy.connect(testatorAddress).setUpWill([]))
                .to.be.revertedWithCustomError(wallegacy, "WallegacySBT__NotSet")
        })

        describe("when the SBT contract is set", function () {
            beforeEach(async () => {
                await expect(wallegacy.setSBTContract(wallegacySBT)).to.emit(wallegacy, "SBTContractSet").withArgs(wallegacySBT);
            })

            describe("the testator is not registered", function () {
                it("should reverts with Wallegacy__NoTestator error", async function () {
                    await expect(wallegacy.connect(testatorAddress).setUpWill([]))
                        .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoTestator").withArgs(testatorAddress);
                })
            })

            describe("when the testator is registered", function () {
                beforeEach(async () => {
                    await wallegacy.connect(notaryAddress).newWill(testatorAddress)
                })

                describe("the testator do not provides heirs", async function () {
                    it("should reverts with Wallegacy__NoHeirs error", async function () {
                        await expect(wallegacy.connect(testatorAddress).setUpWill([]))
                            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoHeirs");
                    })
                })

                describe("the testator provides heirs without addresses", async function () {
                    it("should reverts with Wallegacy__NoHeirs error", async function () {
                        const heirs: Wallegacy.HeirStruct[] = [
                            { heirAddress: ethers.ZeroAddress, percent: 50 },
                        ]
                        await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__HeirWithoutAddress").withArgs(0);
                    })
                })


                describe("the testator do not send funds", async function () {
                    it("should reverts with Wallegacy__NewWillNotGoodPercent error", async function () {
                        const heirs: Wallegacy.HeirStruct[] = [
                            { heirAddress: heirOneAddress, percent: 50 },
                            { heirAddress: heirTwoAddress, percent: 50 },
                        ]

                        await expect(wallegacy.connect(testatorAddress).setUpWill(heirs))
                            .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NotEnoughAmount");
                    })
                })

                describe("all conditions are satisfied", async function () {
                    it("should lock the testator funds, update will status and mint a token", async function () {
                        const heirs: Wallegacy.HeirStruct[] = [
                            { heirAddress: heirOneAddress, percent: 50 },
                            { heirAddress: heirTwoAddress, percent: 50 },
                        ]

                        await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                            .to.emit(wallegacy, "WillSetUp").withArgs(testatorAddress)
                            .and.to.emit(wallegacy, "TestatorValueLocked").withArgs(testatorAddress, depositAmount)
                            .and.to.emit(wallegacySBT, "SBTMinted").withArgs(testatorAddress, BigInt(testatorAddress.address))

                        const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();

                        expect(will.status).to.equal(1);
                        expect(will.heirs.length).to.equal(2);
                        expect(will.heirs[0].heirAddress).to.equal(heirOneAddress)
                        expect(will.heirs[1].heirAddress).to.equal(heirTwoAddress)
                        expect(will.heirs[0].percent).to.equal(50)
                        expect(will.heirs[1].percent).to.equal(50)

                    })
                })
            })
        })
    })
})

describe("Wallegacy cancelWill", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;
    const depositAmount = ethers.parseEther("2.0");

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, heirOneAddress, heirTwoAddress, testatorAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
        await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
        await wallegacy.setSBTContract(wallegacySBT);
    });

    describe("when the SBT is not set", function () {
        it("should reverts with WallegacySBT__NotSet error", async function () {
            const wallegacyWithoutSBT = await ethers.deployContract("Wallegacy", ownerAddress);
            await wallegacyWithoutSBT.connect(ownerAddress).registerNotary(notaryAddress);
            await wallegacyWithoutSBT.connect(notaryAddress).newWill(testatorAddress);

            await expect(wallegacyWithoutSBT.connect(testatorAddress).cancelWill())
                .to.be.revertedWithCustomError(wallegacyWithoutSBT, "WallegacySBT__NotSet");
        });
    });

    describe("when the testator is not registered", function () {
        it("should reverts with Wallegacy__NoTestator error", async function () {
            await expect(wallegacy.connect(testatorAddress).cancelWill())
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoTestator").withArgs(testatorAddress);
        });
    });

    describe("when the testator has a will", function () {
        beforeEach(async () => {
            await wallegacy.connect(notaryAddress).newWill(testatorAddress);
            const heirs: Wallegacy.HeirStruct[] = [
                { heirAddress: heirOneAddress, percent: 50 },
                { heirAddress: heirTwoAddress, percent: 50 },
            ];
            await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
        });

        it("should cancel the will, burn SBT and emit event", async function () {
            const tokenID = BigInt(testatorAddress.address);

            await expect(wallegacy.connect(testatorAddress).cancelWill())
                .to.emit(wallegacy, "WillCancelled").withArgs(testatorAddress)
                .and.to.emit(wallegacySBT, "SBTBurned").withArgs(testatorAddress, tokenID);

            await expect(wallegacy.connect(notaryAddress).getWill()).to.be.revertedWithCustomError(wallegacy, "Wallegacy__WillNotFound").withArgs(notaryAddress);

            const isTestator = await wallegacy.isTestator(testatorAddress);
            expect(isTestator).to.equal(false);

            await expect(wallegacySBT.ownerOf(tokenID))
                .to.be.revertedWithCustomError(wallegacySBT, "ERC721NonexistentToken");
        });
    });
});

describe("Wallegacy triggerLegacyProcess", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let anotherNotaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let heirThreeAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;
    const depositAmount = ethers.parseEther("10.0");

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, anotherNotaryAddress, heirOneAddress, heirTwoAddress, heirThreeAddress, testatorAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
        await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
        await wallegacy.connect(ownerAddress).registerNotary(anotherNotaryAddress);
        await wallegacy.setSBTContract(wallegacySBT);
    });

    describe("when the caller is not a notary", function () {
        it("should reverts with Wallegacy__Unauthorized error", async function () {
            await expect(wallegacy.connect(notOwnerAddress).triggerLegacyProcess(testatorAddress))
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__Unauthorized");
        });
    });

    describe("when the testator does not exist", function () {
        it("should reverts with Wallegacy__NoTestator error", async function () {
            await expect(wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress))
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoTestator").withArgs(testatorAddress);
        });
    });

    describe("when the testator has a valid will", function () {
        beforeEach(async () => {
            await wallegacy.connect(notaryAddress).newWill(testatorAddress);
        });

        describe("with one heir receiving 100%", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it.only("should transfer full amount to heir and emit events", async function () {
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirBalanceBefore = await ethers.provider.getBalance(heirOneAddress);

                await expect(wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirOneAddress)
                    .and.to.emit(wallegacy, "LegacySent").withArgs(testatorAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirBalanceAfter = await ethers.provider.getBalance(heirOneAddress);

                expect(contractBalanceBefore - contractBalanceAfter).to.equal(depositAmount);
                expect(heirBalanceAfter - heirBalanceBefore).to.equal(depositAmount);

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(2); // WillStatus.DONE

                const valueLocked = await wallegacy.getLockedValue(testatorAddress);
                expect(valueLocked).to.equal(0);
            });
        });

        describe("with two heirs receiving 50% each", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 50 },
                    { heirAddress: heirTwoAddress, percent: 50 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should transfer correct amounts to each heir and emit events", async function () {
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirOneBalanceBefore = await ethers.provider.getBalance(heirOneAddress);
                const heirTwoBalanceBefore = await ethers.provider.getBalance(heirTwoAddress);

                const expectedAmountPerHeir = depositAmount / 2n;

                await expect(wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirOneAddress)
                    .and.to.emit(wallegacy, "LegacySentToHeir").withArgs(heirTwoAddress)
                    .and.to.emit(wallegacy, "LegacySent").withArgs(testatorAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirOneBalanceAfter = await ethers.provider.getBalance(heirOneAddress);
                const heirTwoBalanceAfter = await ethers.provider.getBalance(heirTwoAddress);

                expect(contractBalanceBefore - contractBalanceAfter).to.equal(depositAmount);
                expect(heirOneBalanceAfter - heirOneBalanceBefore).to.equal(expectedAmountPerHeir);
                expect(heirTwoBalanceAfter - heirTwoBalanceBefore).to.equal(expectedAmountPerHeir);

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(3); // WillStatus.DONE
            });
        });

        describe("with three heirs receiving different percentages", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 50 },
                    { heirAddress: heirTwoAddress, percent: 30 },
                    { heirAddress: heirThreeAddress, percent: 20 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should transfer correct proportional amounts to each heir", async function () {
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirOneBalanceBefore = await ethers.provider.getBalance(heirOneAddress);
                const heirTwoBalanceBefore = await ethers.provider.getBalance(heirTwoAddress);
                const heirThreeBalanceBefore = await ethers.provider.getBalance(heirThreeAddress);

                const expectedHeirOneAmount = (depositAmount * 50n) / 100n;
                const expectedHeirTwoAmount = (depositAmount * 30n) / 100n;
                const expectedHeirThreeAmount = (depositAmount * 20n) / 100n;

                await expect(wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirOneAddress)
                    .and.to.emit(wallegacy, "LegacySentToHeir").withArgs(heirTwoAddress)
                    .and.to.emit(wallegacy, "LegacySentToHeir").withArgs(heirThreeAddress)
                    .and.to.emit(wallegacy, "LegacySent").withArgs(testatorAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirOneBalanceAfter = await ethers.provider.getBalance(heirOneAddress);
                const heirTwoBalanceAfter = await ethers.provider.getBalance(heirTwoAddress);
                const heirThreeBalanceAfter = await ethers.provider.getBalance(heirThreeAddress);

                expect(contractBalanceBefore - contractBalanceAfter).to.equal(depositAmount);
                expect(heirOneBalanceAfter - heirOneBalanceBefore).to.equal(expectedHeirOneAmount);
                expect(heirTwoBalanceAfter - heirTwoBalanceBefore).to.equal(expectedHeirTwoAmount);
                expect(heirThreeBalanceAfter - heirThreeBalanceBefore).to.equal(expectedHeirThreeAmount);

                const totalSent = expectedHeirOneAmount + expectedHeirTwoAmount + expectedHeirThreeAmount;
                expect(totalSent).to.equal(depositAmount);

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(3); // WillStatus.DONE
            });
        });

        describe("when a different notary tries to trigger the process", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should allow any registered notary to trigger the process", async function () {
                await expect(wallegacy.connect(anotherNotaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "LegacySent").withArgs(testatorAddress);
            });
        });

        describe("reentrancy protection", function () {
            it("should change will status before sending funds", async function () {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });

                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(3); // WillStatus.DONE
            });
        });
    });
});