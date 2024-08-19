// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MyERC20.sol";

contract MyERC721 is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct SaleInfo {
        uint256 tokenId;
        address seller;
        uint256 price;
        string uri;
        bool display;
    }

    MyERC20 public paymentToken;
    mapping(uint256 => SaleInfo) public saleInfo;

    event Mint(address indexed to, SaleInfo saleInfo);
    event NFTSold(address indexed seller, address indexed buyer,SaleInfo saleInfo,  uint256 price);

     constructor(MyERC20 _paymentToken, string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable()
    {
        paymentToken = _paymentToken;
    }

    function safeMint(address to, string memory uri) public {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        saleInfo[tokenId] = SaleInfo(tokenId, msg.sender, 0, uri, false);

        emit Mint(to, saleInfo[tokenId]);
    }

    function batchMint(address[] memory to, string[] memory uris) public onlyOwner {
        require(to.length == uris.length, "Arrays length mismatch");
        for (uint256 i = 0; i < to.length; i++) {
            safeMint(to[i], uris[i]);
        }
    }

    function listNFTForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list the NFT for sale");
        require(price > 0, "Price must be greater than zero");

        saleInfo[tokenId].price = price;
        saleInfo[tokenId].display = true;

    }

    function listNFTForDisplay(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list the NFT for display");

        saleInfo[tokenId].price = 0;
        saleInfo[tokenId].display = true;

    }

    function removeNFTFromDisplay(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can remove the NFT from display");

        saleInfo[tokenId].display = false;

    }
    
    function buyNFT(uint256 tokenId) public nonReentrant {
        SaleInfo memory sale = saleInfo[tokenId];
        require(sale.price > 0, "NFT is not for sale");
        require(sale.display, "NFT is not displayed");
        require(paymentToken.balanceOf(msg.sender) >= sale.price, "Insufficient balance to buy NFT");
        require(ownerOf(tokenId) == sale.seller, "Seller is not the current owner"); // Check ownership

        paymentToken.transferFrom(msg.sender, sale.seller, sale.price);

        // Transfer ownership
        _safeTransfer(sale.seller, msg.sender, tokenId, "");

        // Clear sale information
        saleInfo[tokenId].price = 0;
        saleInfo[tokenId].display = false;
        saleInfo[tokenId].seller = msg.sender;  // Update seller info to new owner

        emit NFTSold(sale.seller, msg.sender, saleInfo[tokenId], sale.price);
    }

    function getAllTokensForDisplay() public view returns (SaleInfo[] memory) {
        uint256 totalForDisplay = 0;
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (saleInfo[i].display) {
                totalForDisplay++;
            }
        }

        SaleInfo[] memory tokensForDisplay = new SaleInfo[](totalForDisplay);
        uint256 index = 0;
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (saleInfo[i].display) {
                tokensForDisplay[index] = saleInfo[i];
                index++;
            }
        }
        return tokensForDisplay;
    }

    function getTokensOwnedBy(address owner) public view returns (SaleInfo[] memory) {
        uint256 balance = balanceOf(owner);
        SaleInfo[] memory ownedTokenInfos = new SaleInfo[](balance);

        for (uint256 i = 0; i < balance; i++) {
            ownedTokenInfos[i] = saleInfo[tokenOfOwnerByIndex(owner, i)];
        }

        return ownedTokenInfos;
    }

    // Override functions
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}