# ERC20 template

## Instructions

`https://github.com/ricochen/RicoToken.git`

`npm install`

`truffle test`

## Contracts

`RicoToken.sol` is ERC20-compatible and has the following characteristics:

1. An initial supply of 21,000,000 tokens
2. The ability to mint tokens by owner up to a limit of 6,000,000 tokens and 100,000 per address
3. The ability to mint tokens by users after owner limit of 6,000,000 is reached, up to an additional 6,000,000 tokens and 10,000 per address
4. The ability to transfer tokens after all minting is finished reaching 12,000,000 tokens
