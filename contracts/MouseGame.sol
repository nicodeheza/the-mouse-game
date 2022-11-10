// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./CheeseToken.sol";
import "./PrizeToken.sol";

error MouseGame__inscriptionClose();
error MouseGame__underpayment();
error MouseGame__alreadyRegistered();
error MouseGame__notReadyToStart();
error MouseGame__overpaid();
error MouseGame__trasactionFail();
error MouseGame__tryAgainLater();

// review game state

contract MouseGame {
    enum GameState {
        open,
        playing,
        close
    }
    CheeseToken cheeseToken;
    PrizeToken prizeToken;
    GameState private s_gameSatate = GameState.open;
    uint256 constant ENTRANCE_FEE = 0.0014 ether;
    address[] private s_players;
    uint256 private s_inscriptionStartTime;
    uint256 private s_gameStartTime;
    uint256 constant INSCRIPTION_LIMIT = 10 minutes;
    uint256 constant GAME_DURATION = 2 hours;
    uint256 constant CHEESE_INITIAL_AMOUNT = 240;
    uint256 constant MAX_PLAYERS = 10;
    uint256 constant MIN_PLAYERS = 3;

    constructor(address cheeseTokenAddress, address prizeTokenAddress) {
        cheeseToken = CheeseToken(cheeseTokenAddress);
        prizeToken = PrizeToken(prizeTokenAddress);
    }

    //add event
    function inscribe() public payable {
        if (
            s_gameSatate == GameState.close ||
            getInscriptionTimeLeft() == 0 ||
            s_players.length >= MAX_PLAYERS
        ) {
            if (s_gameSatate == GameState.open) s_gameSatate = GameState.close;
            revert MouseGame__inscriptionClose();
        }
        if (msg.value < ENTRANCE_FEE) revert MouseGame__underpayment();
        if (msg.value > ENTRANCE_FEE) revert MouseGame__overpaid();
        if (isRegistered(msg.sender)) revert MouseGame__alreadyRegistered();

        if (s_inscriptionStartTime == 0) {
            s_inscriptionStartTime = block.timestamp;
        }

        s_players.push(msg.sender);
        cheeseToken.transfer(msg.sender, CHEESE_INITIAL_AMOUNT);
    }

    //add event
    function startGame() public {
        if (s_gameSatate != GameState.close)
            revert MouseGame__notReadyToStart();
        if (s_players.length < MIN_PLAYERS) {
            revertGame();
        } else {
            s_gameStartTime = block.timestamp;
            s_gameSatate = GameState.playing;
        }
    }

    //add event
    function revertGame() internal {
        for (uint i = 0; i < s_players.length; i++) {
            address player = s_players[i];
            if (player != address(0)) {
                cheeseToken.transferFrom(
                    player,
                    address(this),
                    CHEESE_INITIAL_AMOUNT
                );
                (bool sent, ) = payable(player).call{value: ENTRANCE_FEE}("");
                if (!sent) revert MouseGame__tryAgainLater();
                s_players[i] = address(0);
            }
        }
    }

    function isRegistered(address player) internal view returns (bool) {
        for (uint i = 0; i < s_players.length; i++) {
            if (s_players[i] == player) return true;
        }
        return false;
    }

    function getGameState() public view returns (GameState) {
        return s_gameSatate;
    }

    function getInscriptionTimeLeft() public view returns (uint256) {
        if (s_inscriptionStartTime == 0) return 9999;
        uint256 time = block.timestamp - s_inscriptionStartTime;
        if (time >= INSCRIPTION_LIMIT) return 0;
        return INSCRIPTION_LIMIT - time;
    }

    function getGameTimeLeft() public view returns (uint256) {
        if (s_gameStartTime == 0) return 9999;
        uint256 time = block.timestamp - s_gameStartTime;
        if (time >= GAME_DURATION) return 0;
        return GAME_DURATION - time;
    }
}
