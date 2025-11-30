// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

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
    }

    struct Heir {
        address heirAddress;
        uint8 percent;
    }

    mapping(address => Will) private s_testatorToWill; 
    mapping (address => uint256) s_testatorToValueLocked;

    // events

    event WillCreated(address indexed testator);
    event TestatorValueLocked(address indexed testator, uint256 amount);
    event LegacySentToHeir(address indexed heirAddress);
    event LegacySent(address indexed testatorAddress);

    // errors

    error Wallegacy__WillNotFound(address testatorAddress);
    error Wallegacy__NoHeirs();
    error Wallegacy__HeirWithoutAddress(uint256 heirIndex);
    error Wallegacy__NewWillNotGoodPercent(uint8 percent);
    error Wallegacy__NotEnoughAmount();
    error Wallegacy__WillStatusNotCorrect();
    error Wallegacy__WillNoValueLocked(address testatorAddress);
    error Wallegacy__ErrorSendingLegacy(address testatorAddress, address heirAddress, uint256 heirAmount);

    constructor() {
    }


    function getWill() public view returns(Will memory) {
        Will memory will = s_testatorToWill[msg.sender];
        
        if (!will.exists) {
            revert Wallegacy__WillNotFound(msg.sender);
        }

        return will;
    }

    function getLockedValue() public view returns(uint256) {
         return s_testatorToValueLocked[msg.sender];
    } 

    /// todo: add a check if Will exists here to allow people to fund the contract ?
    function lockTestatorFunds() public payable {
        // revert with custom errors is more gas efficient than require
        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        }

        s_testatorToValueLocked[msg.sender] = msg.value;

        emit TestatorValueLocked(msg.sender, msg.value);
    }

   /// @dev the status is always set to DRAFT on creation  
   /// TODO: add a check if the user has set multiple heirs with the same address ?
    function createWill(Heir[] memory heirsParams) public payable returns(Will memory createdWill)  {
        if (heirsParams.length == 0) {
            revert Wallegacy__NoHeirs();
        }

        if (msg.value <= 0) {
            revert Wallegacy__NotEnoughAmount();
        } 


        uint8 totalPercent = 0;

        // here we check if all heirs have a valid address 
        // we also increment to total percent to validate that it is strictly equal to 100
        for (uint256 i = 0; i < heirsParams.length; i++) {
            if(heirsParams[i].heirAddress ==  address(0)) {
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
            heirs: heirsParams
        });

        emit WillCreated(msg.sender); 

        return s_testatorToWill[msg.sender];
    }
    

    /// todo manage correctly the rest
    function sendLegacyToHeirs(address testatorAddress) private {
        Will storage testatorWill = s_testatorToWill[testatorAddress];
        if (!testatorWill.exists) {
            revert Wallegacy__WillNotFound(testatorAddress);
        }

        if (testatorWill.status != WillStatus.SAVED) {
            revert Wallegacy__WillStatusNotCorrect();
        }
        
        uint256 valueLocked = s_testatorToValueLocked[testatorAddress];
        if (valueLocked == 0) {
            revert Wallegacy__WillNoValueLocked(testatorAddress);
        }

        if (testatorWill.heirs.length == 0) {
            revert Wallegacy__NoHeirs();
        }

        // we first change the state of the contract before sending ETH to avoid reentrancy
        // pattern Check Effect Interaction (CEI)
        // we also can use OpenZeppelin library
        testatorWill.status = WillStatus.DONE;
        s_testatorToValueLocked[testatorAddress] = 0;

        // we compute the amount to send and we send it
        for (uint256 i=0; i < testatorWill.heirs.length; i++) {
            uint256 heirAmount = (valueLocked * testatorWill.heirs[i].percent) / 100;

            (bool success, ) = testatorWill.heirs[i].heirAddress.call{value: heirAmount}("");
            if (!success) {
                revert Wallegacy__ErrorSendingLegacy(testatorAddress, testatorWill.heirs[i].heirAddress, heirAmount);
            }
            emit LegacySentToHeir(testatorWill.heirs[i].heirAddress);
        }


        emit LegacySent(testatorAddress);
    } 
}
