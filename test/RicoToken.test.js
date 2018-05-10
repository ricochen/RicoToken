const util = require('./util.js');
const RicoToken = artifacts.require("./RicoToken.sol");

contract('RicoToken', accounts => {
    const owner = accounts[0];
    const user1 = accounts[3];
    const user2 = accounts[4];
    const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    let token;

    before(async () => {
        token = await RicoToken.new({ from: owner });
    });

    describe('Initial State', () => {
        it('should have a name', async () => {
            const name = await token.name();
            assert.equal(name, 'Rico Token');
        });

        it('should have a symbol', async () => {
            const symbol = await token.symbol();
            assert.equal(symbol, 'RICO');
        });

        it('should have 18 decimals', async () => {
            const decimals = await token.decimals();
            assert(decimals.eq(18));
        });

        it('should have an initial supply', async () => {
            const INITIAL_SUPPLY = await token.INITIAL_SUPPLY();
            assert.equal(INITIAL_SUPPLY, (21000000 * (10 ** 18)));
        });

        it('should have the correct mint limits', async () => {
            const OWNER_MINT_LIMIT = await token.OWNER_MINT_LIMIT();
            assert.equal(OWNER_MINT_LIMIT, (6000000 * (10 ** 18)));

            const USER_MINT_LIMIT = await token.USER_MINT_LIMIT();
            assert.equal(USER_MINT_LIMIT, (6000000 * (10 ** 18)));

            const OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT = await token.OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT();
            assert.equal(OWNER_TOKENS_PER_ADDRESS_MINT_LIMIT, (100000 * (10 ** 18)));

            const USER_TOKENS_PER_ADDRESS_MINT_LIMIT = await token.USER_TOKENS_PER_ADDRESS_MINT_LIMIT();
            assert.equal(USER_TOKENS_PER_ADDRESS_MINT_LIMIT, (10000 * (10 ** 18)));
        });

        it('should have mint limits reached initialized to false', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const userMintLimitReached = await token.userMintLimitReached();

            assert.equal(ownerMintLimitReached, false);
            assert.equal(userMintLimitReached, false);
        });
    });

    describe('constructor', () => {
        it('should assign totalSupply_ to equal INITIAL_SUPPLY', async () => {
            const totalSupply = (await token.totalSupply()).toNumber();
            const INITIAL_SUPPLY = (await token.INITIAL_SUPPLY()).toNumber();

            assert.equal(totalSupply, INITIAL_SUPPLY);
        });

        it('should assign the balance of msg.sender to equal totalSupply_', async () => {
            const totalSupply = (await token.totalSupply()).toNumber();
            const ownerBalance = (await token.balanceOf(owner)).toNumber();

            assert.equal(ownerBalance, totalSupply);
        });

        it.skip('should emit the Transfer event with the parameters address(0), msg.sender, and totalSupply_', async () => {
            const totalSupply = await token.totalSupply();
            const instance = await RicoToken.deployed();
            const tx = await instance.create();

            assert.equal(logs.length, 1);
            assert.equal(tx.logs[0].event, 'Transfer');
            assert.equal(tx.logs[0].args.from.valueOf(), ZERO_ADDRESS);
            assert.equal(tx.logs[0].args.to.valueOf(), owner);
            assert.equal(tx.logs[0].args.value, totalSupply);
        });
    });

    describe('transfer', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should revert if modifier onlyWhenMintingFinished is not fulfilled', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const transfer = token.transfer(user1, 100, { from: user2 });

            assert.equal(ownerMintLimitReached, false);
            await util.assertRevert(transfer);
        });

        it('should revert if modifier validDestination is not fulfilled', async () => {
            await util.assertRevert(token.transfer(ZERO_ADDRESS, 100, { from: user1 }));
            await util.assertRevert(token.transfer(token.address, 100, { from: user1 }));
        });

        it.skip('should allow users to transfer onlyWhenMintingFinished', async () => {
            await token.transfer(user1, 100, { from: user2 });
            const user2Balance = await token.balanceOf(user2);

            assert.equal(user2Allowance, 0);
            assert.equal(user2Balance, 100);
        });
    });

    describe('transferFrom', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should revert if modifier onlyWhenMintingFinished is not fulfilled', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const transferFrom = token.transferFrom(owner, user2, 100, { from: user2 });

            assert.equal(ownerMintLimitReached, false);
            await util.assertRevert(transferFrom);
        });

        it('should revert if modifier validDestination is not fulfilled', async () => {
            await util.assertRevert(token.transferFrom(owner, ZERO_ADDRESS, 100, { from: user1 }));
            await util.assertRevert(token.transferFrom(owner, token.address, 100, { from: user1 }));
        });

        it.skip('should allow users to transferFrom onlyWhenMintingFinished', async () => {
            await token.approve(user2, 100, { from: owner });
            await token.transferFrom(owner, user2, 100, { from: user2 });
            const user2Allowance = await token.allowance(owner, user2);
            const user2Balance = await token.balanceOf(user2);

            assert.equal(user2Allowance, 0);
            assert.equal(user2Balance, 100);
        });
    });

    describe('mint', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should revert if owner minting is not enabled or msg.sender is not owner', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const mint = token.mint(user1, 100, { from: user1 });

            assert.equal(ownerMintLimitReached, false);
            await util.assertRevert(mint);
        });

        it('should allow owner to mint tokens if owner minting is enabled and number of tokens minted is <= 6000000 or address token balance to mint is <= 100000', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const mint = token.mint(user1, 100, { from: owner });
            const user1MintedAmount = (await token.balanceOf(user1)).toNumber();

            assert.equal(ownerMintLimitReached, false);
            assert.equal(user1MintedAmount, 100);
        });

        it('should revert if number of tokens minted is > 6000000 or address token balance to mint is > 100000', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const mint = token.mint(user1, 10000000000000000000000000000000000000, { from: owner });

            await util.assertRevert(mint);
        });
    });

    describe('userMint', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should revert if user minting is not enabled', async () => {
            const userMintLimitReached = await token.userMintLimitReached();
            const mint = token.mint(user1, 100, { from: user1 });

            assert.equal(userMintLimitReached, false);
            await util.assertRevert(mint);
        });

        it.skip('should allow user to mint tokens if user minting is enabled and number of tokens minted is <= 6000000 or address token balance to mint is <= 10000', async () => {
            const userMintLimitReached = await token.userMintLimitReached();
            const mint = token.mint(user1, 100, { from: user });
            const user1MintedAmount = (await token.balanceOf(user1)).toNumber();

            assert.equal(userMintLimitReached, false);
            assert.equal(user1MintedAmount, 100);
        });

        it('should revert if number of tokens minted is > 6000000 or address token balance to mint is > 100000', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const mint = token.mint(user1, 10000000000000000000000000000000000000, { from: owner });

            await util.assertRevert(mint);
        });
    });

    describe('getMintedAmount', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should revert if user minting is not enabled', async () => {
            const userMintLimitReached = await token.userMintLimitReached();
            const mint = token.mint(user1, 100, { from: user1 });

            assert.equal(userMintLimitReached, false);
            await util.assertRevert(mint);
        });

        it.skip('should allow user to mint tokens if user minting is enabled and number of tokens minted is <= 6000000 or address token balance to mint is <= 10000', async () => {
            const userMintLimitReached = await token.userMintLimitReached();
            const mint = token.mint(user1, 100, { from: user });
            const user1MintedAmount = (await token.balanceOf(user1)).toNumber();

            assert.equal(userMintLimitReached, false);
            assert.equal(user1MintedAmount, 100);
        });

        it('should revert if number of tokens minted is > 6000000 or address token balance to mint is > 100000', async () => {
            const ownerMintLimitReached = await token.ownerMintLimitReached();
            const mint = token.mint(user1, 10000000000000000000000000000000000000, { from: owner });

            await util.assertRevert(mint);
        });
    });

    describe('getMintedAmount', () => {
        beforeEach(async () => {
            token = await RicoToken.new({ from: owner });
        });

        it('should retrieve the amount of tokens minted by address', async () => {
            const getMintedAmount = await token.getMintedAmount(user1);

            assert.equal(getMintedAmount, 0);
        });
    });
});
