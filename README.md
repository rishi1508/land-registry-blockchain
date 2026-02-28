# Land Registry System Using Ethereum Blockchain

A **decentralized land registry application** built on Ethereum that enables secure, transparent, and tamper-proof property ownership management through smart contracts. Users can register land parcels, verify ownership, transfer properties, and view complete ownership history - all on the blockchain.

## Live Demo

**URL:** [https://rishi1508.github.io/land-registry-blockchain](https://rishi1508.github.io/land-registry-blockchain)

**Requirements:**
- Modern browser (Chrome / Firefox / Brave)
- [MetaMask](https://metamask.io/) browser extension
- Switch MetaMask to **Sepolia testnet**
- Get free test ETH from a [Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

## Architecture

```
+-------------------+     +------------------+     +-------------------+
|   React Frontend  |<--->|     Web3.js      |<--->|  Ethereum Node    |
|   (Dark Theme UI) |     |  (Contract ABI)  |     |  (Alchemy/Sepolia)|
+-------------------+     +------------------+     +-------------------+
         |                         |                        |
         v                         v                        v
+-------------------+     +------------------+     +-------------------+
|    MetaMask       |     |  Smart Contract  |     |  Sepolia Testnet  |
|  (Wallet/Signer)  |     |  (LandRegistry)  |     |  (Ethereum L1)   |
+-------------------+     +------------------+     +-------------------+
```

**Data Flow:**
1. User interacts with React frontend (connect wallet, fill forms)
2. Frontend calls smart contract methods via Web3.js
3. MetaMask signs and broadcasts transactions to Sepolia
4. Blockchain validates and executes the smart contract logic
5. Events are emitted, frontend updates to reflect new state

## Smart Contract

**Contract Address (Sepolia):** `0xE2B49B1a6fc0b97c64252Ca617779Ccb14a965bf`

**Admin Address:** `0x7F585D7A9751a7388909Ed940E29732306A98f0c`

### Core Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerLand()` | Public | Register a new land parcel with plot details |
| `putLandForSale()` | Owner only | List owned land for sale |
| `removeLandFromSale()` | Owner only | Remove land from sale listing |
| `requestTransfer()` | Public | Request transfer of a for-sale property |
| `approveTransfer()` | Owner only | Approve pending transfer (irreversible) |
| `denyTransfer()` | Owner only | Deny a pending transfer request |
| `verifyLand()` | Public (view) | Look up property details by Land ID |
| `getPropertyHistory()` | Public (view) | Get complete ownership chain |
| `getLandsByOwner()` | Public (view) | Get all land IDs owned by an address |
| `getAllLands()` | Admin only | Fetch all registered properties |

### Security Features

- **Duplicate Prevention:** Keccak256 hash of (plotNumber + district + state) prevents re-registration
- **Access Control:** `onlyOwner` and `onlyAdmin` modifiers restrict sensitive operations
- **Input Validation:** All registration fields validated with descriptive `require` messages
- **Indexed Events:** All state changes emit events for frontend listening and indexing
- **NatSpec Documentation:** Full function-level documentation for auditability

## Features

- **Property Registration** - Register land with plot number, area, district, city, state, and size
- **Ownership Verification** - Public lookup of any property by Land ID
- **Transfer Workflow** - List for sale -> Request transfer -> Approve/Deny (on-chain)
- **Property Search** - Search by Land ID or owner Ethereum address
- **Ownership Timeline** - Visual history of all ownership changes with timestamps
- **QR Code Generation** - Generate QR codes for property verification
- **PDF Certificate Export** - Print/export ownership certificates
- **Admin Dashboard** - View all registered lands and ownership histories
- **MetaMask Integration** - Auto-detect wallet, network switching, account change handling
- **Transaction Tracking** - Pending/confirmed/failed status with Etherscan links
- **Dark Theme UI** - Professional blockchain-styled interface
- **Sepolia Testnet** - Runs on Ethereum test network (no real assets)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Ethereum (Sepolia Testnet) |
| Smart Contracts | Solidity ^0.8.9 |
| Contract Framework | Truffle Suite |
| Frontend | React 19, React Router 7 |
| Web3 Library | Web3.js 4.x |
| Wallet | MetaMask |
| Node Provider | Alchemy |
| Hosting | GitHub Pages |
| Styling | Custom CSS (dark theme) |

## Project Structure

```
land-registry-blockchain/
├── README.md
├── landregistration/
│   ├── contracts/
│   │   └── LandRegistry.sol          # Solidity smart contract
│   ├── migrations/
│   │   └── 1_land_registry.js         # Truffle deployment script
│   ├── test/
│   │   └── landRegistry.test.js       # Contract unit tests
│   ├── truffle-config.js              # Truffle configuration (Sepolia)
│   └── front-end/
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── components/
│           │   ├── WalletContext.js    # Web3/MetaMask context provider
│           │   ├── Navbar.js          # Navigation with wallet status
│           │   ├── LandingPage.js     # Hero, stats, how-it-works
│           │   ├── ManageLandPage.js  # Register, verify, transfer
│           │   ├── PropertySearch.js  # Search, QR code, PDF export
│           │   ├── AdminPanel.js      # Admin: all lands, history
│           │   ├── Footer.js          # Footer with links
│           │   └── ConfirmationDialog.js
│           ├── contracts/
│           │   └── LandRegistry.json  # Contract ABI
│           ├── config.js              # Contract addresses, network config
│           ├── App.js                 # Router setup
│           ├── index.js               # Entry point
│           └── styles.css             # Dark theme styles
```

## Running Locally

```bash
# Clone the repository
git clone https://github.com/rishi1508/land-registry-blockchain.git
cd land-registry-blockchain

# Install frontend dependencies
cd landregistration/front-end
npm install

# Start development server
npm start
```

**Prerequisites:** Node.js 16+, MetaMask browser extension, Sepolia test ETH

### Deploying Contracts (Optional)

```bash
# From the landregistration directory
cd landregistration
npm install

# Create .env with your credentials
echo "MNEMONIC=your twelve word mnemonic phrase here
ALCHEMY_API_KEY=your_alchemy_api_key" > .env

# Deploy to Sepolia
npx truffle migrate --network sepolia
```

## Screenshots

> Screenshots of the application UI

| Home | Manage Land | Property Search | Admin Panel |
|------|------------|-----------------|-------------|
| Dark theme hero with stats | Register/verify/transfer | Search + QR + PDF | All lands table |

## What I Learned

Building this project gave me hands-on experience with:

- **Solidity Development** - Writing secure smart contracts with access control, event emission, input validation, and gas optimization. Understanding the EVM execution model, storage vs memory, and the importance of the checks-effects-interactions pattern.

- **Web3.js Integration** - Connecting a React frontend to Ethereum via MetaMask. Handling wallet connections, account changes, network switching, and transaction lifecycle (pending -> confirmed -> failed).

- **Truffle Framework** - Project scaffolding, compilation, migration scripts, and deploying to testnets via HDWalletProvider + Alchemy RPC. Writing Mocha/Chai tests for contract functions.

- **Blockchain Architecture** - Understanding gas costs, block confirmations, event logs, transaction receipts, and why blockchain is suited for use cases requiring immutability and transparency.

- **DApp UX Challenges** - Dealing with transaction confirmation delays, MetaMask popups, network errors, and making blockchain interactions feel intuitive for non-crypto users.

- **React State Management** - Using Context API for global wallet state, useCallback for memoized contract calls, and managing complex UI state for forms, loading indicators, and transaction status.

## Future Enhancements

- Multi-signature approval for high-value transfers
- IPFS integration for storing land survey documents
- Geolocation (latitude/longitude) fields with map visualization
- ERC-721 (NFT) token representation of land deeds
- Mobile-responsive progressive web app
- Mainnet deployment with real governance

## Contact

- **Email:** rishimishra1508@gmail.com
- **GitHub:** [github.com/rishi1508](https://github.com/rishi1508)
- **LinkedIn:** [linkedin.com/in/rishimishra1508](https://www.linkedin.com/in/rishimishra1508)

---

*Built as a Final Year Project demonstrating blockchain-based decentralized application development.*
