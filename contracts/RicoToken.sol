pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";


/**
 * @title RicoToken
 * @dev A standard, mintable ERC20 token with additional functionalities:
 * Transfers are only enabled after minting is finished
 */
contract RicoToken is MintableToken {
    using SafeMath for uint256;

    string public constant name = "Rico Token";
    string public constant symbol = "RICO";
    uint8 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 21000000 * (10 ** uint256(decimals));

    uint256 public constant OWNER_MINT_LIMIT = 6000000 * (10 ** uint256(decimals));
    uint256 public constant USER_MINT_LIMIT = 6000000 * (10 ** uint256(decimals));
    uint256 public constant OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT = 100000 * (10 ** uint256(decimals));
    uint256 public constant USER_TOKENS_PER_ADDRESS_MINT_LIMIT = 10000 * (10 ** uint256(decimals));

    uint256 public numberOfTokensMinted;
    bool public ownerMintLimitReached = false;
    bool public userMintLimitReached = false;

    mapping(address => uint256) tokensMintedToAddress;

    /**
     * @dev Check if minting tokens limits have been reached
     */
    modifier onlyWhenMintingFinished() {
        require(ownerMintLimitReached);
        require(userMintLimitReached);
        require(numberOfTokensMinted == OWNER_MINT_LIMIT.add(USER_MINT_LIMIT));
        _;
    }

    /**
     * @dev Check if owner is allowed to mint and owner limits have not been reached
     * @param _to The address to mint to
     * @param _amount The amount of tokens to mint
     */
    modifier onlyWhenOwnerMintingEnabled(address _to, uint256 _amount) {
        require(!ownerMintLimitReached);
        require(numberOfTokensMinted.add(_amount) <= OWNER_MINT_LIMIT);
        require(tokensMintedToAddress[_to].add(_amount) <= OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT);
        _;
    }

    /**
     * @dev Check if users are allowed to mint and user limits have not been reached
     * @param _to The address to mint to
     * @param _amount The amount of tokens to mint
     */
    modifier onlyWhenUserMintingEnabled(address _to, uint256 _amount) {
        require(ownerMintLimitReached);
        require(!userMintLimitReached);
        require(numberOfTokensMinted.add(_amount) <= OWNER_MINT_LIMIT.add(USER_MINT_LIMIT));
        require(tokensMintedToAddress[_to].add(_amount) <= OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT.add(USER_TOKENS_PER_ADDRESS_MINT_LIMIT));
        _;
    }

    /**
     * @dev Check if the address is a valid destination to transfer tokens to
     * @param _to The address to transfer tokens to
     * The zero address is not valid
     * The contract itself should not receive tokens
     */
    modifier validDestination(address _to) {
        require(_to != address(0));
        require(_to != address(this));
        _;
    }

    /**
     * @dev constructor
     */
    constructor() public {
        totalSupply_ = INITIAL_SUPPLY;

        // Mint tokens
        balances[msg.sender] = totalSupply_;
        emit Transfer(address(0), msg.sender, totalSupply_);
    }

    /**
     * @dev Overrides ERC20 transfer function with modifier that only allows token transfers when transferEnabled and checks destination
     * @param _to The address to transfer tokens to
     * @param _value The amount of tokens to transfer
     * @return A boolean value specifying whether the transfer was successful
     */
    function transfer(address _to, uint256 _value) public onlyWhenMintingFinished validDestination(_to) returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Overrides ERC20 transferFrom function with modifier that only allows token transfers when transferEnabled and checks destination
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _value The amount of tokens to transfer
     * @return A boolean value specifying whether the transfer was successful
     */
    function transferFrom(address _from, address _to, uint256 _value) public onlyWhenMintingFinished validDestination(_to) returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Overrides mint function with modifier that only allows owner to mint tokens when limits have not been reached
     * @param _to The address to mint tokens to
     * @param _amount The amount of tokens to mint
     * @return A boolean value specifying whether the mint was successful
     */
    function mint(address _to, uint256 _amount) public onlyOwner onlyWhenOwnerMintingEnabled(_to, _amount) returns (bool) {
        if (numberOfTokensMinted.add(_amount) == OWNER_MINT_LIMIT) {
            ownerMintLimitReached = true;
        }

        addMintedTokens(_to, _amount);
        return super.mint(_to, _amount);
    }

    /**
     * @dev Mint function for users with modifier that only allows users to mint tokens after limits have been reached
     * @param _amount The amount of tokens to mint
     * @return A boolean value specifying whether the mint was successful
     */
    function userMint(uint256 _amount) public onlyWhenUserMintingEnabled(msg.sender, _amount) returns (bool) {
        if (numberOfTokensMinted.add(_amount) == OWNER_MINT_LIMIT.add(USER_MINT_LIMIT)) {
            userMintLimitReached = true;
        }

        addMintedTokens(msg.sender, _amount);
        totalSupply_ = totalSupply_.add(_amount);
        balances[msg.sender] = balances[msg.sender].add(_amount);
        emit Mint(msg.sender, _amount);
        emit Transfer(address(0), msg.sender, _amount);
        return true;
    }

    /**
     * @dev Internal function to add minted tokens and minted tokens of addresses
     * @param _amount The amount of tokens to mint
     */
    function addMintedTokens(address _to, uint256 _amount) internal {
        numberOfTokensMinted = numberOfTokensMinted.add(_amount);
        tokensMintedToAddress[_to] = tokensMintedToAddress[_to].add(_amount);
    }

    /**
     * @dev Function to check the number of tokens minted by address
     * @param _address The token address to check
     * @return The number of tokens minted for an address
     */
    function getMintedAmount(address _address) public view returns (uint256) {
        return tokensMintedToAddress[_address];
    }
}
