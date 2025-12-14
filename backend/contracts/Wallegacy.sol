// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./WallegacySBT.sol";

contract Wallegacy is Ownable {
    /**
     * @notice Represents the different states of a will throughout its lifecycle
     * @dev Used to control which operations are allowed at each stage
     * @param DRAFT Initial state when a will is created by a notary, before testator configuration
     * @param SAVED Will is configured with heirs and funds locked, awaiting legacy trigger
     * @param WAITING_LEGACY Legacy process triggered by notary, heirs can claim their inheritance
     * @param DONE All heirs have claimed their inheritance, will execution complete
     * @param CANCELLED Will has been cancelled by the testator, funds refunded
     */
    enum WillStatus {
        DRAFT,
        SAVED,
        WAITING_LEGACY,
        DONE,
        CANCELLED
    }

    /**
     * @notice Represents a complete will with testator, heirs, and execution status
     * @dev Core data structure managing the entire inheritance process from creation to distribution
     * @param testator The address of the person who created the will
     * @param status Current state of the will in its lifecycle (DRAFT, SAVED, WAITING_LEGACY, DONE, CANCELLED)
     * @param exists Flag indicating if this will has been initialized (prevents accidental access to default values)
     * @param heirs Array of beneficiaries with their inheritance percentages and amounts
     * @param notary The address of the notary who is atteched to the testator
     * @param index Position of this testator in the notary's testator list (only used to make list navigation easier)
     */
    struct Will {
        address testator;
        WillStatus status;
        bool exists; // for getter function
        Heir[] heirs;
        address notary;
        uint256 index;
    }

    /**
     * @notice Represents an heir and their inheritance allocation
     * @dev Used within the Will struct to define beneficiaries and their share of the inheritance
     * @param heirAddress The blockchain address of the heir who will receive the legacy
     * @param percent The percentage of the inheritance allocated to this heir (must sum to 100% across all heirs)
     * @param legacy The calculated amount in wei this heir will receive based on their percentage
     */
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
    event TriggerLegacyProcess(address indexed testatorAddress);

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
    error Wallegacy__NoWaitingHeir();
    error Wallegacy__AlreadyTestator(address testatorAddress);
    error WallegacySBT__AlreadySet();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Restricts function access to registered notaries only
     * @dev Checks if msg.sender is in the s_notaries mapping
     * @custom:throws Wallegacy__Unauthorized if caller is not a registered notary
     */
    modifier onlyNotary() {
        if (!s_notaries[msg.sender]) {
            revert Wallegacy__Unauthorized();
        }
        _;
    }

    /**
     * @notice Restricts function access to registered testators only
     * @dev Verifies that the caller owns a Soulbound Testament token (SBT balance = 1).
     *      Also ensures the SBT contract has been properly initialized
     * @custom:throws WallegacySBT__NotSet if the SBT contract has not been configured
     * @custom:throws Wallegacy__NoTestator if caller does not own an SBT (not a registered testator)
     */
    modifier onlyTestator() {
        if (address(sbtContract) == address(0)) {
            revert WallegacySBT__NotSet();
        }

        if (sbtContract.balanceOf(msg.sender) != 1)
            revert Wallegacy__NoTestator(msg.sender);
        _;
    }

    /**
     * @notice Ensures the SBT contract has been configured before executing the function
     * @dev Checks that the sbtContract address is not the zero address
     * @custom:throws WallegacySBT__NotSet if the SBT contract has not been initialized
     */

    modifier onlyWithSBTContractSet() {
        if (address(sbtContract) == address(0)) {
            revert WallegacySBT__NotSet();
        }
        _;
    }

    /**
     * @notice Restricts function access to heirs who are waiting to claim their inheritance
     * @dev Checks if msg.sender is marked as a waiting heir in the s_waitingHeirs mapping.
     *      Heirs are marked as waiting when the legacy process is triggered by a notary
     * @custom:throws Wallegacy__NoWaitingHeir if caller is not a waiting heir
     */
    modifier onlyWaitingHeir() {
        if (!s_waitingHeirs[msg.sender]) revert Wallegacy__NoWaitingHeir();
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

    /**
     * @notice Sets the Soulbound Token (SBT) contract address used for testament representation
     * @dev Links the Wallegacy contract to the SBT contract. This function can only be called once during
     *      contract initialization to prevent accidental changes to the SBT contract
     * @param _sbtContract The address of the WallegacySBT contract
     * @custom:throws WallegacySBT__NoAddress if the provided address is the zero address
     * @custom:throws WallegacySBT__AlreadySet if the SBT contract has already been configured
     * @custom:emits SBTContractSet when the SBT contract address is successfully set
     * @custom:access Restricted to contract owner only (onlyOwner modifier)
     * @custom:security One-time initialization - prevents modification after initial setup
     */
    function setSBTContract(address _sbtContract) external onlyOwner {
        if (_sbtContract == address(0)) {
            revert WallegacySBT__NoAddress();
        }

        if (address(sbtContract) != address(0))
            revert WallegacySBT__AlreadySet();

        sbtContract = WallegacySBT(_sbtContract);
        emit SBTContractSet(_sbtContract);
    }

    /**
     * @notice Registers a new notary authorized to manage Will creation
     * @dev Only the contract owner can register notaries. Reverts if the notary is already registered
     * @param notaryAddress The address of the notary to register
     * @custom:throws Wallegacy__NotaryAlreadyRegistered if the notary is already registered
     * @custom:emits NotaryRegistered when a notary is successfully registered
     * @custom:access Restricted to contract owner only (onlyOwner modifier)
     */
    function registerNotary(address notaryAddress) public onlyOwner {
        if (s_notaries[notaryAddress]) {
            revert Wallegacy__NotaryAlreadyRegistered();
        }

        s_notaries[notaryAddress] = true;
        emit NotaryRegistered(notaryAddress);
    }

    /**
     * @notice Registers a testator in the system
     * @dev Internal function called when a will is created. Prevents duplicate registration
     * @param testatorAddress The address of the testator to register
     * @custom:throws Wallegacy__AlreadyTestator if the testator is already registered
     * @custom:emits TestatorRegistered when a testator is successfully registered
     * @custom:access Private function, only callable internally by the contract
     */
    function registerTestator(address testatorAddress) private {
        if (s_testators[testatorAddress])
            revert Wallegacy__AlreadyTestator(testatorAddress);
        s_testators[testatorAddress] = true;

        emit TestatorRegistered(testatorAddress);
    }

    /**
     * @notice Locks ETH funds from a testator to be distributed to heirs
     * @dev Accumulates funds sent by the testator. Multiple calls add to the total locked amount
     * @custom:throws Wallegacy__NotEnoughAmount if no ETH is sent (msg.value <= 0)
     * @custom:emits TestatorValueLocked with the sender address and amount locked
     * @custom:access Restricted to registered testators only (onlyTestator modifier)
     * @custom:payable Requires ETH to be sent with the transaction
     */
    function lockTestatorFunds() public payable onlyTestator {
        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        s_testatorToValueLocked[msg.sender] += msg.value;

        emit TestatorValueLocked(msg.sender, msg.value);
    }

    /**
     * @notice Creates a new will for a testator
     * @dev Initializes a will in DRAFT status, registers the testator, and mints an SBT to represent the will.
     *      The will is associated with the calling notary who facilitates the process
     * @param testatorAddress The address of the testator for whom the will is being created
     * @custom:throws Wallegacy__WillAlreadySet if the testator already has an existing will
     * @custom:emits NotaryNewWill with the notary address and testator address
     * @custom:access Restricted to registered notaries only (onlyNotary modifier)
     * @custom:security Requires SBT contract to be set (onlyWithSBTContractSet modifier)
     * @custom:sideeffects Registers the testator, adds them to the notary's testator list, and mints an SBT
     */
    function newWill(
        address testatorAddress
    ) public onlyNotary onlyWithSBTContractSet {
        if (s_testatorToWill[testatorAddress].exists) {
            revert Wallegacy__WillAlreadySet(testatorAddress);
        }

        s_testatorToWill[testatorAddress] = Will({
            testator: testatorAddress,
            status: WillStatus.DRAFT,
            exists: true,
            heirs: new Heir[](0),
            notary: msg.sender,
            index: s_notaryToTestators[msg.sender].length
        });

        registerTestator(testatorAddress);

        s_notaryToTestators[msg.sender].push(testatorAddress);
        emit NotaryNewWill(msg.sender, testatorAddress);

        sbtContract.mint(testatorAddress);
    }

    /**
     * @notice Configures a will with heirs and their legs distribution
     * @dev Validates heirs, calculates legacy amounts based on percentages, locks funds, and updates will status to SAVED.
     *      Percentages must sum to exactly 100. Legacy amounts are calculated from the ETH sent with this transaction
     * @param heirsParams Array of heirs with their addresses and inheritance percentages
     * @custom:throws Wallegacy__NoHeirs if the heirs array is empty
     * @custom:throws Wallegacy__NotEnoughAmount if no ETH is sent (msg.value <= 0)
     * @custom:throws Wallegacy__TestatorWithoutWill if the testator doesn't have an existing will
     * @custom:throws Wallegacy__HeirWithoutAddress if any heir has a zero address
     * @custom:throws Wallegacy__TestatorHeir if the testator tries to add themselves as an heir
     * @custom:throws Wallegacy__NewWillNotGoodPercent if the total percentages don't equal exactly 100
     * @custom:emits WillSetUp when the will is successfully configured
     * @custom:access Restricted to registered testators only (onlyTestator modifier)
     * @custom:security Requires SBT contract to be set (onlyWithSBTContractSet modifier)
     * @custom:payable Requires ETH to be sent with the transaction to fund the inheritance
     * @custom:sideeffects Locks testator funds and updates will status from DRAFT to SAVED
     */
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
        uint256 remaining = msg.value;

        for (uint256 i = 0; i < heirsParams.length; i++) {
            if (heirsParams[i].heirAddress == address(0)) {
                revert Wallegacy__HeirWithoutAddress(i);
            }

            if (heirsParams[i].heirAddress == msg.sender) {
                revert Wallegacy__TestatorHeir();
            }

            heirsParams[i].legacy = (remaining * heirsParams[i].percent) / 100;
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

    /**
     * @notice Cancels a testator's will and refunds locked funds
     * @dev Deletes all will data, unregisters the testator, removes from notary's list, burns SBT, and refunds locked funds
     * @custom:throws Wallegacy__NoCancelPossible if the will status is WAITING_LEGACY (legacy distribution has started)
     * @custom:throws Wallegacy__RefundFailed if the ETH refund transfer fails
     * @custom:emits WillCancelled when the will is successfully cancelled
     * @custom:access Restricted to registered testators only (onlyTestator modifier)
     * @custom:security Requires SBT contract to be set (onlyWithSBTContractSet modifier)
     * @custom:security Follows Checks-Effects-Interactions pattern: state changes before external calls
     */
    function cancelWill() public onlyWithSBTContractSet onlyTestator {
        Will storage testatorWill = s_testatorToWill[msg.sender];
        if (testatorWill.status == WillStatus.WAITING_LEGACY) {
            revert Wallegacy__NoCancelPossible();
        }

        uint256 amountToRefund = s_testatorToValueLocked[msg.sender];
        address notaryAddress = testatorWill.notary;
        uint256 testatorIndex = testatorWill.index;

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
        emit WillCancelled(msg.sender);

        sbtContract.burn(msg.sender);

        if (amountToRefund > 0) {
            (bool success, ) = payable(msg.sender).call{value: amountToRefund}(
                ""
            );
            if (!success) {
                revert Wallegacy__RefundFailed(msg.sender);
            }
        }
    }

    /**
     * @notice Triggers the legacy distribution process for a deceased testator
     * @dev Changes the will status to WAITING_LEGACY and marks all heirs as eligible to claim their inheritance.
     *      This function is called by the notary when the testator has passed away
     * @param testatorAddress The address of the deceased testator whose will should be executed
     * @custom:throws Wallegacy__NoTestator if the address is not a registered testator
     * @custom:emits TriggerLegacyProcess when the legacy process is successfully triggered
     * @custom:access Restricted to registered notaries only (onlyNotary modifier)
     */
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

        emit TriggerLegacyProcess(testatorAddress);
    }

    /**
     * @notice Allows an heir to claim their inheritance from a testator's will
     * @dev Implements pull-over-push pattern for secure fund distribution. Follows CEI pattern to prevent reentrancy.
     *      Uses swap-and-pop to efficiently remove the heir from the list. When the last heir claims, the will status
     *      is updated to DONE
     * @param testatorAddress The address of the testator whose legacy is being claimed
     * @custom:throws Wallegacy__NoLegacy if the testator's will doesn't exist
     * @custom:throws Wallegacy__ErrorSendingLegacy if the ETH transfer to the heir fails
     * @custom:emits LegacySentToHeir when an heir successfully claims their inheritance
     * @custom:emits LegacyDone when the last heir claims and the will execution is complete
     * @custom:access Restricted to heirs marked as waiting (onlyWaitingHeir modifier)
     * @custom:security Follows Checks-Effects-Interactions pattern: state changes before external calls
     * @custom:sideeffects Removes heir from will, updates testator's locked value, marks heir as no longer waiting,
     *                     and potentially updates will status to DONE
     */
    function claimLegacy(address testatorAddress) public onlyWaitingHeir {
        Will storage testatorWill = s_testatorToWill[testatorAddress];
        if (!testatorWill.exists) {
            revert Wallegacy__NoLegacy(testatorAddress);
        }

        bool heirValid = false;
        uint256 heirLegacy = 0;

        for (uint256 i = 0; i < testatorWill.heirs.length; i++) {
            Heir memory heir = testatorWill.heirs[i];

            if (heir.heirAddress == msg.sender) {
                heirLegacy = heir.legacy;

                if (testatorWill.heirs.length > 1) {
                    testatorWill.heirs[i] = testatorWill.heirs[
                        testatorWill.heirs.length - 1
                    ];
                }

                testatorWill.heirs.pop();
                if (testatorWill.heirs.length == 0) {
                    testatorWill.status = WillStatus.DONE;
                }

                s_waitingHeirs[heir.heirAddress] = false;
                s_testatorToValueLocked[testatorAddress] -= heirLegacy;

                heirValid = true;

                emit LegacySentToHeir(msg.sender);
                if (testatorWill.heirs.length == 0) {
                    emit LegacyDone(testatorAddress);
                }
                break;
            }
        }

        if (heirValid) {
            s_waitingHeirs[msg.sender] = false;
            (bool success, ) = msg.sender.call{value: heirLegacy}("");
            if (!success) {
                revert Wallegacy__ErrorSendingLegacy(
                    testatorAddress,
                    msg.sender,
                    heirLegacy
                );
            }
        }
    }
}
