const path = require('path');
require("dotenv").config({ path: path.resolve(process.cwd(), '.env.local') });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      },
      mining: {
        auto: false,
        interval: 1000
      }
    },
  },
};
