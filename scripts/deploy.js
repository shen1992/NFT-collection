const {
  ethers
} = require('hardhat')
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

const main = async () => {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS
  const metadataURL = METADATA_URL;

  const cryptoDevsContract = await ethers.getContractFactory('CryptoDevs')
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  )
  console.log('Crypto Devs Contract Address:', await deployedCryptoDevsContract.getAddress())
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();