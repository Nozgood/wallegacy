// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./WallegacySBT.sol";

contract Wallegacy is Ownable {
    enum WillStatus {
        DRAFT, // DRAFT is set when the notary has created the Will but the testator does not have set it up yet
        SAVED, // SAVED is used when all necessaries elements of the Will are correctly set
        WAITING_LEGACY, // WAITING_LEGACY is used when the notary has start legs distribution process and NOT ALL the heirs have claim their legs
        DONE, // DONE is used when funds has been sent to heirs
        CANCELLED // CANCELLES is used only when a Testator call CancelWill() function
    }

    struct Will {
        address testator;
        WillStatus status;
        bool exists; // for getter function
        Heir[] heirs;
        address notary;
        uint256 index;
    }

    struct Heir {
        address heirAddress;
        uint8 percent;
        uint256 legacy;
    }

    mapping(address => bool) private s_waitingHeirs;
    mapping(address => Will) private s_testatorToWill;
    mapping(address => address[]) private s_notaryToTestators;
    mapping(address => uint256) private s_testatorToValueLocked;
    mapping(address => bool) private s_testators;
    mapping(address => bool) private s_notaries;

    WallegacySBT public sbtContract;

    event WillSetUp(address indexed testator);
    event TestatorValueLocked(address indexed testator, uint256 amount);
    event LegacySentToHeir(address indexed heirAddress);
    event LegacySent(address indexed testatorAddress);
    event WillCancelled(address indexed testatorAddress);
    event SBTContractSet(address indexed sbtAddess);
    event NotaryNewWill(
        address indexed notaryAddress,
        address indexed testatorAddress
    );
    event NotaryRegistered(address indexed notaryAddress);
    event TestatorRegistered(address indexed testatorAddress);
    event LegacyDone(address indexed testatorAddress);
    event Wallegacy__TriggerLegacyProcess(address indexed testatorAddress);

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

    error Wallegacy__NoTestator(address sender);
    error Wallegacy__NoTestatorNoNotary(address sender);
    error WallegacySBT__NoAddress();
    error WallegacySBT__NotSet();
    error Wallegacy__Unauthorized();
    error Wallegacy__WillAlreadySet(address testatorAddress);
    error Wallegacy__TestatorWithoutWill(address sender);
    error Wallegacy__RefundFailed(address sender);
    error Wallegacy__NoLegacy(address testatorAddress);
    error Wallegacy__NoCancelPossible();
    error Wallegacy__TestatorHeir();
    error Wallegacy__NotaryAlreadyRegistered();

    constructor() Ownable(msg.sender) {}

    modifier onlyNotary() {
        if (!s_notaries[msg.sender]) {
            revert Wallegacy__Unauthorized();
        }
        _;
    }

    modifier onlyTestator() {
        if (address(sbtContract) == address(0)) {
            revert WallegacySBT__NotSet();
        }

        if (sbtContract.balanceOf(msg.sender) != 1)
            revert Wallegacy__NoTestator(msg.sender);
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

    function getNotaryWills() public view onlyNotary returns (Will[] memory) {
        address[] memory testators = s_notaryToTestators[msg.sender];
        Will[] memory wills = new Will[](testators.length);

        for (uint256 i = 0; i < testators.length; i++) {
            wills[i] = s_testatorToWill[testators[i]];
        }

        return wills;
    }

    function getLockedValue(
        address testatorAddress
    ) public view onlyTestator returns (uint256) {
        return s_testatorToValueLocked[testatorAddress];
    }

    function isNotary(address notaryAddress) public view returns (bool) {
        return s_notaries[notaryAddress];
    }

    function isTestator() external view returns (bool) {
        return s_testators[msg.sender];
    }

    function isWaitingHeir() external view returns (bool) {
        return s_waitingHeirs[msg.sender];
    }

    function setSBTContract(address _sbtContract) external {
        if (_sbtContract == address(0)) {
            revert WallegacySBT__NoAddress();
        }

        sbtContract = WallegacySBT(_sbtContract);
        emit SBTContractSet(_sbtContract);
    }

    function registerNotary(address notaryAddress) public onlyOwner {
        if (s_notaries[notaryAddress] == true) {
            revert Wallegacy__NotaryAlreadyRegistered();
        }

        s_notaries[notaryAddress] = true;
        emit NotaryRegistered(notaryAddress);
    }

    function registerTestator(address testatorAddress) private {
        s_testators[testatorAddress] = true;

        emit TestatorRegistered(testatorAddress);
    }

    function lockTestatorFunds() public payable onlyTestator {
        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        s_testatorToValueLocked[msg.sender] += msg.value;

        emit TestatorValueLocked(msg.sender, msg.value);
    }

    /// @dev this function should only be called by a notary to setup the Will of a Testator
    /// @dev after this processs, it should be the testator who will update the Will setting up his heirs etc
    function newWill(
        address testatorAddress
    ) public onlyNotary onlyWithSBTContractSet {
        if (s_testatorToWill[testatorAddress].exists) {
            revert Wallegacy__WillAlreadySet(testatorAddress);
        }

        Heir[] memory newHeirs;

        s_testatorToWill[testatorAddress] = Will({
            testator: testatorAddress,
            status: WillStatus.DRAFT,
            exists: true,
            heirs: newHeirs,
            notary: msg.sender,
            index: s_notaryToTestators[msg.sender].length
        });

        registerTestator(testatorAddress);

        s_notaryToTestators[msg.sender].push(testatorAddress);
        sbtContract.mint(testatorAddress);

        emit NotaryNewWill(msg.sender, testatorAddress);
    }

    function setUpWill(
        Heir[] memory heirsParams
    ) public payable onlyWithSBTContractSet onlyTestator {
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
        for (uint256 i = 0; i < heirsParams.length; i++) {
            if (heirsParams[i].heirAddress == address(0)) {
                revert Wallegacy__HeirWithoutAddress(i);
            }

            if (heirsParams[i].heirAddress == msg.sender) {
                revert Wallegacy__TestatorHeir();
            }

            heirsParams[i].legacy = (msg.value * heirsParams[i].percent) / 100;
            totalPercent += heirsParams[i].percent;
        }

        if (totalPercent != 100) {
            revert Wallegacy__NewWillNotGoodPercent(totalPercent);
        }

        lockTestatorFunds();

        testatorWill.heirs = heirsParams;
        testatorWill.status = WillStatus.SAVED;

        emit WillSetUp(msg.sender);
    }

    function cancelWill() public onlyWithSBTContractSet onlyTestator {
        Will storage testatorWill = s_testatorToWill[msg.sender];
        if (testatorWill.status == WillStatus.WAITING_LEGACY) {
            revert Wallegacy__NoCancelPossible();
        }

        uint256 amountToRefund = s_testatorToValueLocked[msg.sender];
        address notaryAddress = testatorWill.notary;
        uint256 testatorIndex = testatorWill.index;

        // REENTRANCY CHECK - We first change the state of BC before sending money
        delete s_testatorToWill[msg.sender].heirs;
        s_testatorToValueLocked[msg.sender] = 0;
        s_testatorToWill[msg.sender].exists = false;
        s_testatorToWill[msg.sender].status = WillStatus.CANCELLED;
        s_testators[msg.sender] = false;

        address[] storage testators = s_notaryToTestators[notaryAddress];
        uint256 lastIndex = testators.length - 1;

        if (testatorIndex != lastIndex) {
            address lastTestator = testators[lastIndex];
            testators[testatorIndex] = lastTestator;
            s_testatorToWill[lastTestator].index = testatorIndex;
        }
        testators.pop();

        sbtContract.burn(msg.sender);

        if (amountToRefund > 0) {
            (bool success, ) = payable(msg.sender).call{value: amountToRefund}(
                ""
            );
            if (!success) {
                revert Wallegacy__RefundFailed(msg.sender);
            }
        }

        emit WillCancelled(msg.sender);
    }

    function triggerLegacyProcess(address testatorAddress) public onlyNotary {
        if (!s_testators[testatorAddress]) {
            revert Wallegacy__NoTestator(testatorAddress);
        }

        Will storage testatorWill = s_testatorToWill[testatorAddress];
        testatorWill.status = WillStatus.WAITING_LEGACY;

        for (uint256 i = 0; i < testatorWill.heirs.length; i++) {
            Heir storage heir = testatorWill.heirs[i];
            s_waitingHeirs[heir.heirAddress] = true;
        }

        emit Wallegacy__TriggerLegacyProcess(testatorAddress);
    }

    function claimLegacy(address testatorAddress) public {
        Will storage testatorWill = s_testatorToWill[testatorAddress];
        if (!testatorWill.exists) {
            revert Wallegacy__NoLegacy(testatorAddress);
        }

        for (uint256 i = 0; i < testatorWill.heirs.length; i++) {
            Heir storage heir = testatorWill.heirs[i];
            if (heir.heirAddress == msg.sender) {
                s_waitingHeirs[msg.sender] = false;
                uint256 legacy = heir.legacy;

                if (testatorWill.heirs.length > 1) {
                    testatorWill.heirs[i] = testatorWill.heirs[
                        testatorWill.heirs.length - 1
                    ];
                }

                testatorWill.heirs.pop();
                s_waitingHeirs[heir.heirAddress] = false;
                s_testatorToValueLocked[testatorAddress] -= legacy;

                (bool success, ) = msg.sender.call{value: legacy}("");
                if (!success) {
                    revert Wallegacy__ErrorSendingLegacy(
                        testatorAddress,
                        msg.sender,
                        legacy
                    );
                }

                emit LegacySentToHeir(msg.sender);
                break;
            }
        }

        if (testatorWill.heirs.length == 0) {
            testatorWill.status = WillStatus.DONE;
            emit LegacyDone(testatorAddress);
        }
    }
}
