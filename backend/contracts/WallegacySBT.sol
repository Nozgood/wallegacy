// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WallegacySBT is ERC721 {
    string private _baseTokenURI;
    uint256 private _tokenIDCounter;

    address public wallegacyContract;

    // events
    event SBTMinted(address indexed testatorAddress, uint256 indexed tokenID);
    event SBTBurned(address indexed testatorAddress, uint256 indexed tokenID);

    // errors
    error SBT__NoWallegacyContract();
    error SBT__TestatorAlreadyHasSBT(address testatorAddress);
    error SBT_NoSBTFound(address testatorAddress);
    error SBT__TransferNotAllowed();

    modifier onlyWallegacyContract() {
        if (msg.sender != wallegacyContract) {
            revert SBT__NoWallegacyContract();
        }
        _;
    }

    constructor(
        string memory baseTokenURI,
        address _wallegacyContract
    ) ERC721("Wallegacy", "WLSBT") {
        _baseTokenURI = baseTokenURI;
        wallegacyContract = _wallegacyContract;
    }

    function mint(
        address testatorAddress
    ) external onlyWallegacyContract returns (uint256) {
        if (balanceOf(testatorAddress) != 0) {
            revert SBT__TestatorAlreadyHasSBT(testatorAddress);
        }

        uint256 tokenID = uint256(uint160(testatorAddress));

        _safeMint(testatorAddress, tokenID);
        emit SBTMinted(testatorAddress, tokenID);

        return tokenID;
    }

    function burn(address testatorAddress) external onlyWallegacyContract {
        uint256 tokenID = uint256(uint160(testatorAddress));

        if (_ownerOf(tokenID) != testatorAddress) {
            revert SBT_NoSBTFound(testatorAddress);
        }

        _burn(tokenID);

        emit SBTBurned(testatorAddress, tokenID);
    }

    // override of update function to make transfer not possible
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        // Block any transfer or burn after minting
        if (from != address(0) && to != address(0) && to != from) {
            revert SBT__TransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }
}
