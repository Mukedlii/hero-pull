// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Weapon1155} from "../src/Weapon1155.sol";

/// @dev Deploy with:
/// forge script script/DeployWeapon1155.s.sol:DeployWeapon1155 --rpc-url $BASE_RPC_URL --broadcast --verify -vvvv
contract DeployWeapon1155 is Script {
    function run() external returns (Weapon1155 deployed) {
        // Owner to set price/URI/withdraw
        address owner = vm.envAddress("WEAPON_OWNER");

        // Example base URI: https://hero-pull.vercel.app/api/weapons/metadata/{id}.json
        string memory baseUri = vm.envString("WEAPON_BASE_URI");

        // Set to ~ $0.15 equivalent in ETH (adjust later via setMintPrice)
        uint256 mintPriceWei = vm.envUint("WEAPON_MINT_PRICE_WEI");

        vm.startBroadcast();
        deployed = new Weapon1155(baseUri, owner, mintPriceWei);
        vm.stopBroadcast();
    }
}
