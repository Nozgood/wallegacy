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

contract Wallegacy is Ownable {
    enum WillStatus {
        DRAFT, // DRAFT is the gasPayed property is set to false, the Will is mandatory DRAFT
        SAVED, // SAVED is used when all necessaries elements of the Will are correctly set
        DONE, // DONE is used when funds has been sent to heirs
        CANCELLED // CANCELLES is used only when a Testator call CancelWill() function
    }

    struct Will {
        address testator;
        WillStatus status;
        bool gasPayed; // DEPRECATED - TO BE REMOVED
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

    event WillSetUp(address indexed testator);
    event TestatorValueLocked(address indexed testator, uint256 amount);
    event LegacySentToHeir(address indexed heirAddress);
    event LegacySent(address indexed testatorAddress);
    event WillCancelled(address indexed testatorAddress);
    event SBTContractSet(address indexed sbtAddess);
    event NotaryCancelWill(address indexed notaryAddress);
    event NotaryNoMoreWill(address indexed notaryAddress);
    event NotaryNewWill(
        address indexed notaryAddress,
        address indexed testatorAddress
    );
    event NotaryRegistered(address indexed notaryAddress);
    event TestatorRegistered(address indexed testatorAddress);
    event NotaryAddWill(address indexed notaryAddress);
    event NotaryRemovedWill(address indexed notaryAddress);

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
    error Wallegacy__NoTestator(address sender);
    error Wallegacy__TestatorAlreadyHasWill(address testatorAddress);
    error WallegacySBT__NoAddress();
    error WallegacySBT__NotSet();
    error Wallegacy__Unauthorized();
    error Wallegacy__NewWillMissingNotary();
    error Wallegacy__WillAlreadySet(address testatorAddress);
    error Wallegacy__TestatorWithoutWill(address sender);
    error Wallegacy__NotaryNegativeNumberOfWill(address notaryAddress);

    constructor() Ownable(msg.sender) {}

    modifier onlyNotary() {
        if (!s_notaries[msg.sender]) {
            revert Wallegacy__Unauthorized();
        }
        _;
    }

    modifier onlyTestatorOrNotary() {
        if (!s_testators[msg.sender] && !isNotary(msg.sender)) {
            revert Wallegacy__NoTestator(msg.sender);
        }
        _;
    }

    modifier onlyWithSBTContractSet() {
        if (address(sbtContract) == address(0)) {
            revert WallegacySBT__NotSet();
        }
        _;
    }

    function getWill() public view onlyTestatorOrNotary returns (Will memory) {
        Will memory will = s_testatorToWill[msg.sender];

        if (!will.exists) {
            revert Wallegacy__WillNotFound(msg.sender);
        }

        return will;
    }

    function getLockedValue(
        address testatorAddress
    ) public view returns (uint256) {
        return s_testatorToValueLocked[testatorAddress];
    }

    function isNotary(address notaryAddress) public view returns (bool) {
        return s_notaries[notaryAddress];
    }

    function isTestator() external view returns (bool) {
        return s_testators[msg.sender];
    }

    function setSBTContract(address _sbtContract) external {
        if (_sbtContract == address(0)) {
            revert WallegacySBT__NoAddress();
        }

        sbtContract = WallegacySBT(_sbtContract);
        emit SBTContractSet(_sbtContract);
    }

    function registerNotary(address notaryAddress) public onlyOwner {
        s_notaries[notaryAddress] = true;

        emit NotaryRegistered(notaryAddress);
    }

    function registerTestator(address testatorAddress) private {
        s_testators[testatorAddress] = true;

        emit TestatorRegistered(testatorAddress);
    }

    function addWillToNotary() private onlyNotary {
        s_notaryToNumberOfWill[msg.sender]++;

        emit NotaryAddWill(msg.sender);
    }

    function removeWillToNotary(address notaryAddress) private {
        s_notaryToNumberOfWill[notaryAddress]--;
        if (s_notaryToNumberOfWill[notaryAddress] < 0) {
            revert Wallegacy__NotaryNegativeNumberOfWill(notaryAddress);
        }

        emit NotaryRemovedWill(notaryAddress);
    }

    /// todo: add a check if Will exists here to allow people to fund the contract ?
    function lockTestatorFunds() public payable onlyTestatorOrNotary {
        // revert with custom errors is more gas efficient than require
        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        s_testatorToValueLocked[msg.sender] += msg.value;

        emit TestatorValueLocked(msg.sender, msg.value);
    }

    /// @dev this function should only be called by a notary to setup the Will of a Testator
    /// @dev after this processs, it should be the testator who will update the Will setting up his heirs etc
    function newWill(address testatorAddress) public onlyNotary {
        if (s_testatorToWill[testatorAddress].exists) {
            revert Wallegacy__WillAlreadySet(testatorAddress);
        }

        Heir[] memory newHeirs;

        s_testatorToWill[testatorAddress] = Will({
            testator: testatorAddress,
            status: WillStatus.DRAFT,
            gasPayed: false,
            exists: true,
            heirs: newHeirs,
            notary: msg.sender
        });

        registerTestator(testatorAddress);
        addWillToNotary();

        emit NotaryNewWill(msg.sender, testatorAddress);
    }

    /// TODO: add a check if the user has set multiple heirs with the same address ?
    function setUpWill(
        Heir[] memory heirsParams
    ) public payable onlyWithSBTContractSet onlyTestatorOrNotary {
        if (heirsParams.length == 0) {
            revert Wallegacy__NoHeirs();
        }

        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        Will storage testatorWill = s_testatorToWill[msg.sender];
        if (!testatorWill.exists) {
            revert Wallegacy__TestatorWithoutWill(msg.sender);
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

        // lock the funds of the Testator
        lockTestatorFunds();

        sbtContract.mint(msg.sender);

        testatorWill.heirs = heirsParams;
        testatorWill.status = WillStatus.SAVED;

        emit WillSetUp(msg.sender);
    }

    function cancelWill() public onlyTestatorOrNotary onlyWithSBTContractSet {
        delete s_testatorToWill[msg.sender].heirs;
        s_testatorToWill[msg.sender].exists = false;
        s_testatorToWill[msg.sender].status = WillStatus.CANCELLED;
        s_testators[msg.sender] = false;

        removeWillToNotary(s_testatorToWill[msg.sender].notary);
        sbtContract.burn(msg.sender);

        emit WillCancelled(msg.sender);
    }

    function triggerLegacyProcess(address testatorAddress) public onlyNotary {
        sendLegacyToHeirs(testatorAddress);
    }

    /// todo manage correctly the rest
    function sendLegacyToHeirs(address testatorAddress) private {
        if (!s_testators[testatorAddress]) {
            revert Wallegacy__NoTestator(testatorAddress);
        }

        Will storage testatorWill = s_testatorToWill[testatorAddress];
        uint256 valueLocked = s_testatorToValueLocked[testatorAddress];

        // we first change the state of the contract before sending ETH to avoid reentrancy
        // pattern Check Effect Interaction (CEI)
        // we also can use OpenZeppelin library to setup a Guard (double check)
        testatorWill.status = WillStatus.DONE;
        s_testatorToValueLocked[testatorAddress] = 0;
        removeWillToNotary(testatorWill.notary);

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
