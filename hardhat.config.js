require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { vars } = require("hardhat/config");

const {
  API_URL,
  PRIVATE_KEY
} = process.env
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: API_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }
};
