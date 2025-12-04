// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./WallegacySBT.sol";

/*
  Contract elements should be laid out in the following order:
    1. Pragma statements
    2. Import statements
    3. Events
    4. Errors
    5. Interfaces
    6. Libraries
    7. Contracts

  Inside each contract, library or interface, use the following order:
    1. Type declarations
    2. State variables
    3. Events
    4. Errors
    5. Modifiers
    6. Functions 
*/

contract Wallegacy {
    enum WillStatus {
        DRAFT, // DRAFT is the gasPayed property is set to false, the Will is mandatory DRAFT
        SAVED, // SAVED is used when all necessaries elements of the Will are correctly set
        DONE, // DONE is used when funds has been sent to heirs
        CANCELLED
    }

    struct Will {
        address testator;
        WillStatus status;
        bool gasPayed;
        bool exists; // for getter function
        Heir[] heirs;
        address notary;
    }

    struct Heir {
        address heirAddress;
        uint8 percent;
    }

    //    address private immutable i_relayerAddress;

    mapping(address => Will) private s_testatorToWill;
    mapping(address => uint256) private s_testatorToValueLocked;
    mapping(address => bool) private s_testators;
    mapping(address => uint256) private s_notaryToNumberOfWill;
    mapping(address => bool) private s_notaries;

    WallegacySBT public sbtContract;

    event WillCreated(address indexed testator);
    event TestatorValueLocked(address indexed testator, uint256 amount);
    event LegacySentToHeir(address indexed heirAddress);
    event LegacySent(address indexed testatorAddress);
    event WillCancelled(address indexed testatorAddress);
    event SBTContractSet(address indexed sbtAddess);
    event NotaryCancelWill(address indexed notaryAddress);
    event NotaryNoMoreWill(address indexed notaryAddress);

    error Wallegacy__WillNotFound(address testatorAddress);
    error Wallegacy__NoHeirs();
    error Wallegacy__HeirWithoutAddress(uint256 heirIndex);
    error Wallegacy__NewWillNotGoodPercent(uint8 percent);
    error Wallegacy__NotEnoughAmount();
    error Wallegacy__WillStatusNotCorrect();
    error Wallegacy__WillNoValueLocked(address testatorAddress);
    error Wallegacy__ErrorSendingLegacy(
        address testatorAddress,
        address heirAddress,
        uint256 heirAmount
    );
    error Wallegacy__WillDone();
    error Wallegacy__NoTestator();
    error Wallegacy__TestatorAlreadyHasWill(address testatorAddress);
    error WallegacySBT__NoAddress();
    error WallegacySBT__NotSet();
    error Wallegacy__Unauthorized();
    error Wallegacy__NewWillMissingNotary();

    constructor() {}

    modifier onlyNotary() {
        if (!s_notaries[msg.sender]) {
            revert Wallegacy__Unauthorized();
        }
        _;
    }

    modifier onlyTestator() {
        if (!s_testators[msg.sender]) {
            revert Wallegacy__NoTestator();
        }
        _;
    }

    modifier onlyWithSBTContractSet() {
        if (address(sbtContract) == address(0)) {
            revert WallegacySBT__NotSet();
        }
        _;
    }

    function getWill() public view onlyTestator returns (Will memory) {
        Will memory will = s_testatorToWill[msg.sender];

        if (!will.exists) {
            revert Wallegacy__WillNotFound(msg.sender);
        }

        return will;
    }

    function getLockedValue() public view returns (uint256) {
        return s_testatorToValueLocked[msg.sender];
    }

    function isNotary(address notaryAddress) public view returns (bool) {
        return s_notaries[notaryAddress];
    }

    function setSBTContract(address _sbtContract) external {
        if (_sbtContract == address(0)) {
            revert WallegacySBT__NoAddress();
        }

        sbtContract = WallegacySBT(_sbtContract);
        emit SBTContractSet(_sbtContract);
    }

    /// todo: add a check if Will exists here to allow people to fund the contract ?
    function lockTestatorFunds() public payable {
        // revert with custom errors is more gas efficient than require
        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        s_testatorToValueLocked[msg.sender] += msg.value;

        emit TestatorValueLocked(msg.sender, msg.value);
    }

    function isTestator() external view returns (bool) {
        return s_testators[msg.sender];
    }

    /// @dev the status is always set to DRAFT on creation
    /// TODO: add a check if the user has set multiple heirs with the same address ?
    function createWill(
        Heir[] memory heirsParams,
        address notaryAddress
    ) public payable onlyWithSBTContractSet {
        if (s_testators[msg.sender]) {
            revert Wallegacy__TestatorAlreadyHasWill(msg.sender);
        }

        if (heirsParams.length == 0) {
            revert Wallegacy__NoHeirs();
        }

        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        if (notaryAddress == address(0)) {
            revert Wallegacy__NewWillMissingNotary();
        }

        uint8 totalPercent = 0;
        // here we check if all heirs have a valid address
        // we also increment to total percent to validate that it is strictly equal to 100
        for (uint256 i = 0; i < heirsParams.length; i++) {
            if (heirsParams[i].heirAddress == address(0)) {
                revert Wallegacy__HeirWithoutAddress(i);
            }

            totalPercent += heirsParams[i].percent;
        }

        if (totalPercent != 100) {
            revert Wallegacy__NewWillNotGoodPercent(totalPercent);
        }

        // lock the value of the Testator
        lockTestatorFunds();

        s_testatorToWill[msg.sender] = Will({
            testator: msg.sender,
            status: WillStatus.SAVED,
            gasPayed: false,
            exists: true,
            heirs: heirsParams,
            notary: notaryAddress
        });

        sbtContract.mint(msg.sender);

        s_testators[msg.sender] = true;
        s_notaryToNumberOfWill[notaryAddress]++;

        if (!isNotary(notaryAddress)) {
            s_notaries[notaryAddress] = true;
        }

        emit WillCreated(msg.sender);
    }

    function cancelWill() public onlyTestator onlyWithSBTContractSet {
        delete s_testatorToWill[msg.sender].heirs;
        s_testatorToWill[msg.sender].exists = false;
        s_testatorToWill[msg.sender].status = WillStatus.CANCELLED;
        s_testators[msg.sender] = false;

        address notaryAddress = s_testatorToWill[msg.sender].notary;
        s_notaryToNumberOfWill[notaryAddress]--;
        if (s_notaryToNumberOfWill[notaryAddress] == 0) {
            s_notaries[notaryAddress] = false;
        }

        sbtContract.burn(msg.sender);

        emit WillCancelled(msg.sender);
    }

    // is it ok to set a revert in private function ?
    function cancelNotary(address notaryAddress) private {
        if (isNotary(notaryAddress)) {
            s_notaryToNumberOfWill[notaryAddress]--;
            emit NotaryCancelWill(notaryAddress);
            if (s_notaryToNumberOfWill[notaryAddress] == 0) {
                s_notaries[notaryAddress] = false;
                emit NotaryNoMoreWill(notaryAddress);
            }
        }
    }

    function triggerLegacyProcess(address testatorAddress) public onlyNotary {
        sendLegacyToHeirs(testatorAddress);
    }

    /// todo manage correctly the rest
    function sendLegacyToHeirs(address testatorAddress) private {
        if (!s_testators[testatorAddress]) {
            revert Wallegacy__NoTestator();
        }

        Will storage testatorWill = s_testatorToWill[testatorAddress];
        uint256 valueLocked = s_testatorToValueLocked[testatorAddress];

        // we first change the state of the contract before sending ETH to avoid reentrancy
        // pattern Check Effect Interaction (CEI)
        // we also can use OpenZeppelin library
        testatorWill.status = WillStatus.DONE;
        cancelNotary(msg.sender);

        // we compute the amount to send and we send it
        for (uint256 i = 0; i < testatorWill.heirs.length; i++) {
            uint256 heirAmount = (valueLocked * testatorWill.heirs[i].percent) /
                100;

            (bool success, ) = testatorWill.heirs[i].heirAddress.call{
                value: heirAmount
            }("");
            if (!success) {
                revert Wallegacy__ErrorSendingLegacy(
                    testatorAddress,
                    testatorWill.heirs[i].heirAddress,
                    heirAmount
                );
            }
            emit LegacySentToHeir(testatorWill.heirs[i].heirAddress);
        }

        emit LegacySent(testatorAddress);
    }
}
