// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleERC721Royalty
 * @dev Basic ERC-721 mintable contract with metadata URI storage and royalty support.
 */
contract SimpleERC721Royalty is ERC721URIStorage, ERC2981, Ownable {
    uint256 public nextTokenId;

    constructor(
        string memory name_,
        string memory symbol_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_
    ) ERC721(name_, symbol_) {
        require(royaltyReceiver_ != address(0), "Royalty receiver required");
        _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
    }

    /**
     * @dev Mint a new token and assign metadata URI.
     */
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId += 1;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
