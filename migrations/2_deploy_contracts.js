const Finergy = artifacts.require("./Finergy.sol");

module.exports = function (deployer) {
  deployer.deploy(Finergy, "0x2E69e82d7FCDc486e67b012B4008FCE60d0e753a");
};
