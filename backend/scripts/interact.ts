import hre from "hardhat";


const { ethers, networkHelpers } = await hre.network.connect();

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const heirTwoAddress = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
    const signer = await ethers.getSigner(heirTwoAddress);

    const wallegacy = await ethers.getContractAt("Wallegacy", contractAddress)


    const isWaitingHeir = await wallegacy.connect(signer).isWaitingHeir();
    console.log(isWaitingHeir)
}

main()