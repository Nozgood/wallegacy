import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.connect();

async function main() {
    // Remplace par l'adresse de ton contrat déployé
    const contractAddress = "0xcd3b766ccdd6ae721141f452c550ca635964ce71";

    // Récupérer la balance
    const balanceWei = await ethers.provider.getBalance(contractAddress);
    const balanceEth = ethers.formatEther(balanceWei);

    console.log("=".repeat(50));
    console.log("Contract Balance:");
    console.log("=".repeat(50));
    console.log(`Address: ${contractAddress}`);
    console.log(`Balance (Wei): ${balanceWei.toString()}`);
    console.log(`Balance (ETH): ${balanceEth}`);
    console.log("=".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });