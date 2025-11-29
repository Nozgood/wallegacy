import hre from "hardhat";

async function main() {
    const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    const wallegacy = await hre.ethers.getContractAt("Wallegacy", contractAddress)

    const will = await wallegacy.getWillByTestator("0xdD2FD4581271e230360230F9337D5c0430Bf44C0")
    console.log(will)
}

main()