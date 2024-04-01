// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
  string _baseTokenURI;
  uint public _price = 0.01 ether;
  bool public _paused;
  uint public maxTokenIds = 20;
  uint public tokenIds;

  IWhitelist whitelist;
  bool public presaleStarted;
  uint public presaleEnded;
  event CurrentTokenIds(uint tokenIds);

  modifier onlyWhenNotPause {
    require(!_paused, 'Contract currently paused');
    _;
  }

  constructor(string memory baseURI, address whitelistContract) ERC721('Crypto Devs', 'CD') {
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract);
  }

  function startPresale() public onlyOwner {
    presaleStarted = true;
    presaleEnded = block.timestamp + 5 minutes;
  }

  function presaleMint() public payable onlyWhenNotPause {
    require(presaleStarted && block.timestamp < presaleEnded, 'Presale is not running');
    try whitelist.whitelistedAddresses(msg.sender) returns (bool hasWhitelist) {
      require(hasWhitelist, 'You are not whitelisted');
    } catch Error(string memory) {
      return require(false, 'You are not whitelisted');
    }
    require(whitelist.whitelistedAddresses(msg.sender), 'You are not whitelisted');
    require(tokenIds < maxTokenIds, 'Exceeded maximum Crypto Devs supply');
    require(msg.value >= _price, 'Ether sent is not correct');
    tokenIds += 1;
    _safeMint(msg.sender, tokenIds);
    tokenURI(tokenIds);
    emit CurrentTokenIds(tokenIds);
  }

  function mint() public payable onlyWhenNotPause {
    require(presaleStarted && block.timestamp >= presaleEnded, 'Presale has not ended yet');
    require(tokenIds < maxTokenIds, 'Exceed maximum Crypto Devs supply');
    require(msg.value >= _price, 'Ether sent is not correct');
    tokenIds += 1;
    _safeMint(msg.sender, tokenIds);
    tokenURI(tokenIds);
    emit CurrentTokenIds(tokenIds);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function setPaused(bool val) public onlyOwner {
    _paused = val;
  }

  function withdraw() public onlyOwner {
    address _owner = owner();
    uint amount = address(this).balance;
    (bool sent,) = _owner.call{value: amount}('');
    require(sent, 'Failed to send Ether');
  }

  receive() external payable {}

  fallback() external payable {}
}