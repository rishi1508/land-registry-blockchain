const config = {
  CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS || '0xE2B49B1a6fc0b97c64252Ca617779Ccb14a965bf',
  ADMIN_ADDRESS: process.env.REACT_APP_ADMIN_ADDRESS || '0x7F585D7A9751a7388909Ed940E29732306A98f0c',
  NETWORK_ID: 11155111,
  NETWORK_NAME: 'Sepolia',
  BLOCK_EXPLORER: 'https://sepolia.etherscan.io',
  shortenAddress: (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
};

export default config;
