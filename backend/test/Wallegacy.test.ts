import hre from "hardhat";
import { Wallegacy } from "../types/ethers-contracts/Wallegacy.js";
import { WallegacySBT } from "../types/ethers-contracts/WallegacySBT.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { expect } from "chai";

const { ethers, networkHelpers } = await hre.network.connect();

async function setUpWallegacy() {
    const [
        ownerAddress,
        notOwnerAddress,
        notaryAddress,
        anotherNotaryAddress,
        heirOneAddress,
        heirTwoAddress,
        heirThreeAddress,
        testatorAddress
    ]: HardhatEthersSigner[] = await ethers.getSigners();
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
        await wallegacy.setSBTContract(wallegacySBT);
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
                .and.to.emit(wallegacySBT, "SBTMinted").withArgs(heirOneAddress, BigInt(heirOneAddress.address))

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
                        { heirAddress: ethers.ZeroAddress, percent: 50, legacy: 0 },
                    ]
                    await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                        .to.be.revertedWithCustomError(wallegacy, "Wallegacy__HeirWithoutAddress").withArgs(0);
                })
            })

            describe("the testator provides his own address", async function () {
                it("should reverts with Wallegacy__NoHeirs error", async function () {
                    const heirs: Wallegacy.HeirStruct[] = [
                        { heirAddress: testatorAddress, percent: 50, legacy: 0 },
                    ]
                    await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                        .to.be.revertedWithCustomError(wallegacy, "Wallegacy__TestatorHeir");
                })
            })




            describe("the testator do not send funds", async function () {
                it("should reverts with Wallegacy__NewWillNotGoodPercent error", async function () {
                    const heirs: Wallegacy.HeirStruct[] = [
                        { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                        { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
                    ]

                    await expect(wallegacy.connect(testatorAddress).setUpWill(heirs))
                        .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NotEnoughAmount");
                })
            })

            describe("all conditions are satisfied", async function () {
                it("should lock the testator funds, update will status and mint a token", async function () {
                    const heirs: Wallegacy.HeirStruct[] = [
                        { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                        { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
                    ]

                    await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                        .to.emit(wallegacy, "WillSetUp").withArgs(testatorAddress)
                        .and.to.emit(wallegacy, "TestatorValueLocked").withArgs(testatorAddress, depositAmount)

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

describe("Wallegacy getWill", function () {
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
            await expect(wallegacy.connect(testatorAddress).getWill())
                .to.be.revertedWithCustomError(wallegacy, "WallegacySBT__NotSet")
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
                { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
            ];
            await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
        });

        it("should cancel the will, burn SBT and emit event", async function () {
            const tokenID = BigInt(testatorAddress.address);

            await expect(wallegacy.connect(testatorAddress).cancelWill())
                .to.emit(wallegacy, "WillCancelled").withArgs(testatorAddress)
                .and.to.emit(wallegacySBT, "SBTBurned").withArgs(testatorAddress, tokenID);

            const isTestator = await wallegacy.connect(testatorAddress).isTestator();
            expect(isTestator).to.equal(false);

            await expect(wallegacySBT.ownerOf(tokenID))
                .to.be.revertedWithCustomError(wallegacySBT, "ERC721NonexistentToken");
        });
    });

    describe("when the testator has a will but not setup the will yet", function () {
        beforeEach(async () => {
            await wallegacy.connect(notaryAddress).newWill(testatorAddress);
        });


        it("should cancel the will", async function () {
            try {
                await wallegacy.connect(testatorAddress).cancelWill();
            } catch (error: any) {
                console.log("err: ", error)
            }
        })
    })
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
                    { heirAddress: heirOneAddress, percent: 100, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should set will status to WAITING_LEGACY and mark heir as waiting", async function () {
                await expect(wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "TriggerLegacyProcess").withArgs(testatorAddress);

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(2); // WillStatus.WAITING_LEGACY

                const isWaitingHeir = await wallegacy.connect(heirOneAddress).isWaitingHeir();
                expect(isWaitingHeir).to.be.true;
            });
        });

        describe("with multiple heirs", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                    { heirAddress: heirTwoAddress, percent: 30, legacy: 0 },
                    { heirAddress: heirThreeAddress, percent: 20, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should mark all heirs as waiting", async function () {
                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);

                const isWaitingHeirOne = await wallegacy.connect(heirOneAddress).isWaitingHeir();
                const isWaitingHeirTwo = await wallegacy.connect(heirTwoAddress).isWaitingHeir();
                const isWaitingHeirThree = await wallegacy.connect(heirThreeAddress).isWaitingHeir();

                expect(isWaitingHeirOne).to.be.true;
                expect(isWaitingHeirTwo).to.be.true;
                expect(isWaitingHeirThree).to.be.true;
            });
        });

        describe("when a different notary tries to trigger the process", function () {
            beforeEach(async () => {
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
            });

            it("should allow any registered notary to trigger the process", async function () {
                await expect(wallegacy.connect(anotherNotaryAddress).triggerLegacyProcess(testatorAddress))
                    .to.emit(wallegacy, "TriggerLegacyProcess").withArgs(testatorAddress);
            });
        });
    });
});

describe("Wallegacy claimLegacy", async function () {
    let ownerAddress: HardhatEthersSigner;
    let notOwnerAddress: HardhatEthersSigner;
    let notaryAddress: HardhatEthersSigner;
    let heirOneAddress: HardhatEthersSigner;
    let heirTwoAddress: HardhatEthersSigner;
    let heirThreeAddress: HardhatEthersSigner;
    let testatorAddress: HardhatEthersSigner;
    let wallegacy: Wallegacy;
    let wallegacySBT: WallegacySBT;
    const depositAmount = ethers.parseEther("10.0");

    beforeEach(async () => {
        ({ ownerAddress, notOwnerAddress, notaryAddress, heirOneAddress, heirTwoAddress, heirThreeAddress, testatorAddress, wallegacy, wallegacySBT } = await setUpWallegacy());
        await wallegacy.connect(ownerAddress).registerNotary(notaryAddress);
        await wallegacy.setSBTContract(wallegacySBT);
    });

    describe("when the heir is not registered", function () {
        it("should reverts with Wallegacy__NoWaitingHeir error", async function () {
            await expect(wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress))
                .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoWaitingHeir");
        });
    });

    describe("when the legacy process has been triggered", function () {
        describe("with one heir receiving 100%", function () {
            beforeEach(async () => {
                await wallegacy.connect(notaryAddress).newWill(testatorAddress);
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);
            });

            it("should transfer full amount to heir and close the will", async function () {
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirBalanceBefore = await ethers.provider.getBalance(heirOneAddress);

                await expect(wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirOneAddress)
                    .and.to.emit(wallegacy, "LegacyDone").withArgs(testatorAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirBalanceAfter = await ethers.provider.getBalance(heirOneAddress);


                expect(contractBalanceAfter).to.be.equal(0n);
                expect(heirBalanceAfter - heirBalanceBefore).to.be.closeTo(depositAmount, ethers.parseEther("10.0"));

                const wills = await wallegacy.connect(notaryAddress).getNotaryWills();

                for (let i = 0; i < wills.length; i++) {
                    const will = wills[i];

                    if (will.testator == testatorAddress.address) {
                        expect(will.heirs.length).to.equal(0)
                        expect(will.status).to.equal(3)
                    }

                }
            });
        });

        describe("with two heirs receiving 50% each", function () {
            beforeEach(async () => {
                await wallegacy.connect(notaryAddress).newWill(testatorAddress);
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                    { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);
            });

            it("should allow first heir and second heir to claim their share", async function () {
                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirBalanceBefore = await ethers.provider.getBalance(heirOneAddress);
                const expectedAmount = depositAmount / 2n;

                const isWaitingHeirTwoBefore = await wallegacy.connect(heirTwoAddress).isWaitingHeir();
                expect(isWaitingHeirTwoBefore).to.be.true;

                await expect(wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirOneAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirBalanceAfter = await ethers.provider.getBalance(heirOneAddress);

                expect(contractBalanceBefore - contractBalanceAfter).to.be.closeTo(expectedAmount, ethers.parseEther("0.01"));
                expect(heirBalanceAfter - heirBalanceBefore).to.be.closeTo(expectedAmount, ethers.parseEther("0.01"));

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(2);

                const isWaitingHeirOne = await wallegacy.connect(heirOneAddress).isWaitingHeir();
                expect(isWaitingHeirOne).to.be.false;

                const isWaitingHeirTwoAfterOne = await wallegacy.connect(heirTwoAddress).isWaitingHeir();
                expect(isWaitingHeirTwoAfterOne).to.be.true;

                await expect(wallegacy.connect(heirTwoAddress).claimLegacy(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirTwoAddress)
                    .and.to.emit(wallegacy, "LegacyDone").withArgs(testatorAddress);
            });

            it("should allow second heir to claim after first heir claimed", async function () {
                await wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress);

                const contractBalanceBefore = await ethers.provider.getBalance(wallegacy);
                const heirBalanceBefore = await ethers.provider.getBalance(heirTwoAddress);
                const expectedAmount = depositAmount / 2n;

                await expect(wallegacy.connect(heirTwoAddress).claimLegacy(testatorAddress))
                    .to.emit(wallegacy, "LegacySentToHeir").withArgs(heirTwoAddress)
                    .and.to.emit(wallegacy, "LegacyDone").withArgs(testatorAddress);

                const contractBalanceAfter = await ethers.provider.getBalance(wallegacy);
                const heirBalanceAfter = await ethers.provider.getBalance(heirTwoAddress);

                expect(contractBalanceBefore - contractBalanceAfter).to.be.closeTo(expectedAmount, ethers.parseEther("0.01"));
                expect(heirBalanceAfter - heirBalanceBefore).to.be.closeTo(expectedAmount, ethers.parseEther("0.01"));
            });
        });

        describe("with three heirs receiving different percentages", function () {
            beforeEach(async () => {
                await wallegacy.connect(notaryAddress).newWill(testatorAddress);
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                    { heirAddress: heirTwoAddress, percent: 30, legacy: 0 },
                    { heirAddress: heirThreeAddress, percent: 20, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);
            });

            it("should allow all heirs to claim in any order", async function () {
                const expectedHeirOneAmount = (depositAmount * 50n) / 100n;
                const expectedHeirTwoAmount = (depositAmount * 30n) / 100n;
                const expectedHeirThreeAmount = (depositAmount * 20n) / 100n;

                const heirTwoBalanceBefore = await ethers.provider.getBalance(heirTwoAddress);
                await wallegacy.connect(heirTwoAddress).claimLegacy(testatorAddress);
                const heirTwoBalanceAfter = await ethers.provider.getBalance(heirTwoAddress);
                expect(heirTwoBalanceAfter - heirTwoBalanceBefore).to.be.closeTo(expectedHeirTwoAmount, ethers.parseEther("0.01"));

                const heirOneBalanceBefore = await ethers.provider.getBalance(heirOneAddress);
                await wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress);
                const heirOneBalanceAfter = await ethers.provider.getBalance(heirOneAddress);
                expect(heirOneBalanceAfter - heirOneBalanceBefore).to.be.closeTo(expectedHeirOneAmount, ethers.parseEther("0.01"));

                const heirThreeBalanceBefore = await ethers.provider.getBalance(heirThreeAddress);
                await expect(wallegacy.connect(heirThreeAddress).claimLegacy(testatorAddress))
                    .to.emit(wallegacy, "LegacyDone").withArgs(testatorAddress);
                const heirThreeBalanceAfter = await ethers.provider.getBalance(heirThreeAddress);
                expect(heirThreeBalanceAfter - heirThreeBalanceBefore).to.be.closeTo(expectedHeirThreeAmount, ethers.parseEther("0.01"));

                const will: Wallegacy.WillStructOutput = await wallegacy.connect(testatorAddress).getWill();
                expect(will.status).to.equal(3);
            });
        });

        describe("when an heir tries to claim twice", function () {
            beforeEach(async () => {
                await wallegacy.connect(notaryAddress).newWill(testatorAddress);
                const heirs: Wallegacy.HeirStruct[] = [
                    { heirAddress: heirOneAddress, percent: 100, legacy: 0 },
                ];
                await wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount });
                await wallegacy.connect(notaryAddress).triggerLegacyProcess(testatorAddress);
            });

            it("should not transfer funds on second claim", async function () {
                await wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress);

                const balanceBefore = await ethers.provider.getBalance(heirOneAddress);
                const balanceAfter = await ethers.provider.getBalance(heirOneAddress);
                expect(balanceBefore - balanceAfter).to.be.closeTo(0n, ethers.parseEther("0.001"));

                await expect(wallegacy.connect(heirOneAddress).claimLegacy(testatorAddress))
                    .to.be.revertedWithCustomError(wallegacy, "Wallegacy__NoWaitingHeir")
            });
        });
    });
});

describe("special cases", function () {
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
        await wallegacy.connect(notaryAddress).newWill(testatorAddress)
    });

    describe("the testator cancel his will and re-start another will", function () {
        it("should process correctly", async function () {
            await expect(wallegacy.connect(testatorAddress).cancelWill()).to.emit(wallegacy, "WillCancelled")

            await expect(wallegacy.connect(notaryAddress).newWill(testatorAddress)).to.emit(wallegacy, "NotaryNewWill").withArgs(notaryAddress, testatorAddress)

            const heirs: Wallegacy.HeirStruct[] = [
                { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
            ]

            await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                .to.emit(wallegacy, "WillSetUp").withArgs(testatorAddress)
                .and.to.emit(wallegacy, "TestatorValueLocked").withArgs(testatorAddress, depositAmount)
        })
    })

    describe("the testator setup its will, cancel his will and re-start another will", function () {
        it("should process correctly", async function () {
            const heirs: Wallegacy.HeirStruct[] = [
                { heirAddress: heirOneAddress, percent: 50, legacy: 0 },
                { heirAddress: heirTwoAddress, percent: 50, legacy: 0 },
            ]

            await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                .to.emit(wallegacy, "WillSetUp").withArgs(testatorAddress)
                .and.to.emit(wallegacy, "TestatorValueLocked").withArgs(testatorAddress, depositAmount)


            await expect(wallegacy.connect(testatorAddress).cancelWill()).to.emit(wallegacy, "WillCancelled")
            await expect(wallegacy.connect(notaryAddress).newWill(testatorAddress)).to.emit(wallegacy, "NotaryNewWill").withArgs(notaryAddress, testatorAddress)

            await expect(wallegacy.connect(testatorAddress).setUpWill(heirs, { value: depositAmount }))
                .to.emit(wallegacy, "WillSetUp").withArgs(testatorAddress)
                .and.to.emit(wallegacy, "TestatorValueLocked").withArgs(testatorAddress, depositAmount)
        })
    })
})