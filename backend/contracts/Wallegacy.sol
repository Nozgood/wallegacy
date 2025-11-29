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
        Heir heirs;
    }

    struct Heir {
        address heirAddress;
        uint8 percent;
    }

    mapping(address => Will) private s_testatorToWill; 

    // events

    event WillCreated();

    // errors

    error Wallegacy__WillNotFound();
    error Wallegacy__NoHeirs();

    constructor() {
    }

    function getWillByTestator(address testatorAddress) public view returns(Will memory) {
        Will memory will = s_testatorToWill[testatorAddress];
        
        if (!will.exists) {
            revert Wallegacy__WillNotFound();
        }

        return will;
    }

   /// @dev the status is always set to DRAFT on creation  
    function createWill(Heir memory heirsParams) public returns(Will memory createdWill)  {
        if (heirsParams.heirAddress == address(0)) {
            revert Wallegacy__NoHeirs();
        }

        s_testatorToWill[msg.sender] = Will({
            testator: msg.sender,
            status: WillStatus.DRAFT, 
            gasPayed: false,
            exists: true,
            heirs: heirsParams
        });

        emit WillCreated(); 

        return s_testatorToWill[msg.sender];
    }
}
