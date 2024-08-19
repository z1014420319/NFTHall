// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyERC20 is ERC20, Ownable, ERC20Permit {

    event Mint(address indexed to, uint256 amount);

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
        ERC20Permit(name)
    {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        require(balanceOf(msg.sender) >= amount, "ERC20: approve amount exceeds balance");
        return super.approve(spender, amount);
    }
}