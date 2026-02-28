// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/// @title Land Registry Smart Contract
/// @author Rishi Mishra
/// @notice A decentralized land registry system built on Ethereum
/// @dev Manages land registration, ownership transfers, and property history on the blockchain
contract LandRegistry {
    /// @notice Represents a registered land parcel
    struct Land {
        uint256 id;
        string plotNumber;
        string area;
        string district;
        string city;
        string state;
        uint256 areaSqYd;
        address owner;
        bool isForSale;
        address transferRequest;
    }

    /// @notice Represents a single ownership record in the property history
    struct OwnershipHistory {
        address owner;
        uint256 timestamp;
    }

    /// @notice Total number of registered land parcels
    uint256 public landCount;

    /// @notice Mapping from land ID to Land struct
    mapping(uint256 => Land) public lands;

    /// @notice Mapping from owner address to array of owned land IDs
    mapping(address => uint256[]) public ownerLands;

    /// @notice Mapping from land ID to its complete ownership history
    mapping(uint256 => OwnershipHistory[]) public landOwnershipHistory;

    /// @dev Mapping to prevent duplicate land registrations using a hash of plot details
    mapping(bytes32 => bool) private landExists;

    /// @notice The hardcoded admin address with special privileges
    address public constant ADMIN_ADDRESS =
        0x7F585D7A9751a7388909Ed940E29732306A98f0c;

    /// @notice The admin address (initialized from constant)
    address public admin = ADMIN_ADDRESS;

    // ========== Events ==========

    /// @notice Emitted when a new land parcel is registered
    /// @param id The unique identifier assigned to the land
    /// @param owner The address of the land owner
    /// @param plotNumber The plot number of the registered land
    /// @param area The area/locality name
    /// @param district The district name
    /// @param city The city name
    /// @param state The state name
    /// @param areaSqYd The area in square yards
    event LandRegistered(
        uint256 indexed id,
        address indexed owner,
        string plotNumber,
        string area,
        string district,
        string city,
        string state,
        uint256 areaSqYd
    );

    /// @notice Emitted when a land parcel is listed for sale
    event LandForSale(uint256 indexed id, address indexed owner);

    /// @notice Emitted when a transfer request is made
    event TransferRequested(uint256 indexed id, address indexed requester);

    /// @notice Emitted when land ownership is transferred
    event LandTransferred(
        uint256 indexed id,
        address indexed from,
        address indexed to
    );

    /// @notice Emitted when a transfer request is approved
    event TransferApproved(uint256 indexed id, address indexed newOwner);

    /// @notice Emitted when a transfer request is denied
    event TransferDenied(uint256 indexed id, address indexed requester);

    /// @notice Emitted when a land listing is removed from sale
    event LandRemovedFromSale(uint256 indexed id, address indexed owner);

    // ========== Constructor ==========

    /// @notice Initializes the contract with zero land count
    constructor() {
        landCount = 0;
    }

    // ========== Modifiers ==========

    /// @notice Restricts access to the owner of a specific land parcel
    /// @param _landId The ID of the land to check ownership for
    modifier onlyOwner(uint256 _landId) {
        require(
            lands[_landId].owner == msg.sender,
            "Access denied: You are not the owner of this land"
        );
        _;
    }

    /// @notice Restricts access to the admin address only
    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Access denied: Only admin can perform this action"
        );
        _;
    }

    /// @notice Ensures the land ID exists in the registry
    /// @param _landId The ID to validate
    modifier validLandId(uint256 _landId) {
        require(
            _landId > 0 && _landId <= landCount,
            "Invalid land ID: Land does not exist"
        );
        _;
    }

    // ========== Core Functions ==========

    /// @notice Registers a new land parcel on the blockchain
    /// @dev Creates a unique hash from plot number, district, and state to prevent duplicates
    /// @param _plotNumber The plot identification number
    /// @param _area The area or locality name
    /// @param _district The district name
    /// @param _city The city name
    /// @param _state The state name
    /// @param _areaSqYd The total area in square yards
    function registerLand(
        string memory _plotNumber,
        string memory _area,
        string memory _district,
        string memory _city,
        string memory _state,
        uint256 _areaSqYd
    ) public {
        require(bytes(_plotNumber).length > 0, "Plot number cannot be empty");
        require(bytes(_area).length > 0, "Area cannot be empty");
        require(bytes(_district).length > 0, "District cannot be empty");
        require(bytes(_city).length > 0, "City cannot be empty");
        require(bytes(_state).length > 0, "State cannot be empty");
        require(_areaSqYd > 0, "Area in square yards must be greater than zero");

        bytes32 landHash = keccak256(
            abi.encodePacked(_plotNumber, _district, _state)
        );

        require(
            !landExists[landHash],
            "Duplicate registration: Land with these details is already registered"
        );

        landCount++;
        lands[landCount] = Land(
            landCount,
            _plotNumber,
            _area,
            _district,
            _city,
            _state,
            _areaSqYd,
            msg.sender,
            false,
            address(0)
        );

        landExists[landHash] = true;
        ownerLands[msg.sender].push(landCount);
        landOwnershipHistory[landCount].push(
            OwnershipHistory(msg.sender, block.timestamp)
        );

        emit LandRegistered(
            landCount,
            msg.sender,
            _plotNumber,
            _area,
            _district,
            _city,
            _state,
            _areaSqYd
        );
    }

    /// @notice Lists a land parcel for sale
    /// @param _landId The ID of the land to list
    function putLandForSale(
        uint256 _landId
    ) public onlyOwner(_landId) validLandId(_landId) {
        require(!lands[_landId].isForSale, "Land is already listed for sale");
        require(
            lands[_landId].transferRequest == address(0),
            "Cannot list: A transfer request is pending"
        );

        lands[_landId].isForSale = true;
        emit LandForSale(_landId, msg.sender);
    }

    /// @notice Removes a land parcel from sale listing
    /// @param _landId The ID of the land to remove from sale
    function removeLandFromSale(
        uint256 _landId
    ) public onlyOwner(_landId) validLandId(_landId) {
        require(lands[_landId].isForSale, "Land is not currently for sale");
        require(
            lands[_landId].transferRequest == address(0),
            "Cannot remove: A transfer request is pending"
        );

        lands[_landId].isForSale = false;
        emit LandRemovedFromSale(_landId, msg.sender);
    }

    /// @notice Requests ownership transfer of a land parcel that is for sale
    /// @param _landId The ID of the land to request transfer for
    function requestTransfer(
        uint256 _landId
    ) public validLandId(_landId) {
        require(lands[_landId].isForSale, "Land is not currently for sale");
        require(
            lands[_landId].transferRequest == address(0),
            "Transfer already requested by another user"
        );
        require(
            msg.sender != lands[_landId].owner,
            "Owner cannot request transfer of their own land"
        );

        lands[_landId].transferRequest = msg.sender;
        emit TransferRequested(_landId, msg.sender);
    }

    /// @notice Approves a pending transfer request, transferring ownership
    /// @dev This is irreversible - ownership transfers immediately
    /// @param _landId The ID of the land to approve transfer for
    function approveTransfer(
        uint256 _landId
    ) public onlyOwner(_landId) validLandId(_landId) {
        require(
            lands[_landId].transferRequest != address(0),
            "No transfer request pending for this land"
        );

        address newOwner = lands[_landId].transferRequest;

        // Remove land from current owner's list
        uint256[] storage ownerLandList = ownerLands[msg.sender];
        for (uint256 i = 0; i < ownerLandList.length; i++) {
            if (ownerLandList[i] == _landId) {
                ownerLandList[i] = ownerLandList[ownerLandList.length - 1];
                ownerLandList.pop();
                break;
            }
        }

        // Transfer ownership
        lands[_landId].owner = newOwner;
        lands[_landId].isForSale = false;
        lands[_landId].transferRequest = address(0);
        ownerLands[newOwner].push(_landId);

        // Record in history
        landOwnershipHistory[_landId].push(
            OwnershipHistory(newOwner, block.timestamp)
        );

        emit LandTransferred(_landId, msg.sender, newOwner);
        emit TransferApproved(_landId, newOwner);
    }

    /// @notice Denies a pending transfer request
    /// @param _landId The ID of the land to deny transfer for
    function denyTransfer(
        uint256 _landId
    ) public onlyOwner(_landId) validLandId(_landId) {
        require(
            lands[_landId].transferRequest != address(0),
            "No transfer request pending for this land"
        );

        address requester = lands[_landId].transferRequest;
        lands[_landId].transferRequest = address(0);
        emit TransferDenied(_landId, requester);
    }

    // ========== View Functions ==========

    /// @notice Verifies and retrieves details of a registered land parcel
    /// @param _landId The ID of the land to verify
    /// @return plotNumber The plot identification number
    /// @return area The area/locality name
    /// @return district The district name
    /// @return city The city name
    /// @return state The state name
    /// @return areaSqYd The area in square yards
    /// @return owner The current owner's address
    function verifyLand(
        uint256 _landId
    )
        public
        view
        returns (
            string memory plotNumber,
            string memory area,
            string memory district,
            string memory city,
            string memory state,
            uint256 areaSqYd,
            address owner
        )
    {
        Land memory land = lands[_landId];
        return (
            land.plotNumber,
            land.area,
            land.district,
            land.city,
            land.state,
            land.areaSqYd,
            land.owner
        );
    }

    /// @notice Retrieves all land IDs owned by a specific address
    /// @param _owner The address to look up
    /// @return An array of land IDs owned by the address
    function getLandsByOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        return ownerLands[_owner];
    }

    /// @notice Retrieves land IDs with pending transfer requests for an owner
    /// @param _owner The owner's address to check
    /// @return An array of land IDs with pending transfer requests
    function getPendingTransferRequests(
        address _owner
    ) public view returns (uint256[] memory) {
        uint256[] memory ownedLands = ownerLands[_owner];
        uint256 pendingCount = 0;

        for (uint256 i = 0; i < ownedLands.length; i++) {
            if (lands[ownedLands[i]].transferRequest != address(0)) {
                pendingCount++;
            }
        }

        uint256[] memory pendingRequests = new uint256[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ownedLands.length; i++) {
            if (lands[ownedLands[i]].transferRequest != address(0)) {
                pendingRequests[index] = ownedLands[i];
                index++;
            }
        }

        return pendingRequests;
    }

    /// @notice Retrieves the complete ownership history of a land parcel
    /// @dev Public function - anyone can view the ownership chain for transparency
    /// @param _landId The ID of the land to get history for
    /// @return An array of OwnershipHistory records
    function getPropertyHistory(
        uint256 _landId
    ) public view validLandId(_landId) returns (OwnershipHistory[] memory) {
        return landOwnershipHistory[_landId];
    }

    /// @notice Returns the number of ownership changes for a land parcel
    /// @param _landId The ID of the land
    /// @return The count of ownership records
    function getPropertyHistoryLength(
        uint256 _landId
    ) public view validLandId(_landId) returns (uint256) {
        return landOwnershipHistory[_landId].length;
    }

    // ========== Admin Functions ==========

    /// @notice Retrieves all registered land parcels (admin only)
    /// @return An array of all Land structs
    function getAllLands() public view onlyAdmin returns (Land[] memory) {
        Land[] memory allLands = new Land[](landCount);
        for (uint256 i = 1; i <= landCount; i++) {
            allLands[i - 1] = lands[i];
        }
        return allLands;
    }

    /// @notice Retrieves past ownership details (admin only, legacy)
    /// @dev Use getPropertyHistory for public access
    /// @param _landId The ID of the land
    /// @return An array of OwnershipHistory records
    function getPastOwnershipDetails(
        uint256 _landId
    ) public view onlyAdmin returns (OwnershipHistory[] memory) {
        return landOwnershipHistory[_landId];
    }
}
