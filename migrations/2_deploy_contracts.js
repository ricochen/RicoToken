var RicoToken = artifacts.require("./RicoToken.sol");

module.exports = function(deployer) {
  deployer.deploy(RicoToken);
};
