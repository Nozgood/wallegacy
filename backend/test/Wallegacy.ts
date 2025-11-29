import { expect } from "chai";
import { network } from "hardhat";
import Wallegacy from "../ignition/modules/Wallegacy.js";

const { ethers, networkHelpers } = await network.connect();

async function setupSmartContract() {
    const wallegacy = await ethers.deployContract("Wallegac");
    
    return {wallegacy};
}

describe("Wallegacy Create Will", function() {
    context("the process runs correctly", function(){

    this.beforeEach(async() => {
        ({ wallegacy } = await setupSmartContract());
    })

    it("should returns the created Will", async function () {
            
    })
    })
})



describe("")