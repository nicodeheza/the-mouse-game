// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./CheeseToken.sol";
import "./PrizeToken.sol";
import "./RandomNumber.sol";
import "./MouseNFT.sol";

error MouseGame__inscriptionClose();
error MouseGame__underpayment();
error MouseGame__alreadyRegistered();
error MouseGame__notReadyToStart();
error MouseGame__overpaid();
error MouseGame__trasactionFail();
error MouseGame__tryAgainLater();
error MouseGame__gameInProgress();
error MouseGame__underfunded();

// review game state

contract MouseGame is RandomNumber {
    enum GameState {
        open,
        playing,
        close
    }
    struct Winner {
        uint256 balance;
        address player;
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
    MouseNFT mouseNft;

    constructor(
        address cheeseTokenAddress,
        address prizeTokenAddress,
        address linkAddressm,
        address wrapperAddress,
        address uniswapRouterAddress,
        address mouseNftAddress
    ) RandomNumber(linkAddressm, wrapperAddress, uniswapRouterAddress) {
        cheeseToken = CheeseToken(cheeseTokenAddress);
        prizeToken = PrizeToken(prizeTokenAddress);
        mouseNft = MouseNFT(mouseNftAddress);
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
            requestRandomWords();
        }
    }

    function fulfillRandomWords(uint256, uint256[] memory _randomWords)
        internal
        override
    {
        uint256 mouseOwnerIndex = _randomWords[0] % s_players.length;
        address mouseOwner = s_players[mouseOwnerIndex];
        mouseNft.mint(mouseOwner);
        s_gameStartTime = block.timestamp;
        s_gameSatate = GameState.playing;
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

    //add event
    function endGame() public {
        if (getGameTimeLeft() > 0 || s_gameSatate != GameState.playing) {
            revert MouseGame__gameInProgress();
        }
        Winner memory winner = Winner(0, address(0));
        for (uint i = 0; i < s_players.length; i++) {
            address player = s_players[1];
            uint256 playerCheeseBalance = cheeseToken.balanceOf(player);
            if (winner.balance < playerCheeseBalance) {
                winner.player = player;
                winner.balance = playerCheeseBalance;
            }

            cheeseToken.transferFrom(
                player,
                address(this),
                playerCheeseBalance
            );
            prizeToken.mint(player, playerCheeseBalance);
        }

        uint256 mouseCheeseBalance = cheeseToken.balanceOf(address(mouseNft));
        cheeseToken.transferFrom(
            address(mouseNft),
            address(this),
            mouseCheeseBalance
        );
        prizeToken.mint(winner.player, mouseCheeseBalance);
        mouseNft.burn();

        s_gameSatate = GameState.open;
        s_gameStartTime = 0;
        s_inscriptionStartTime = 0;
        delete s_players;
    }

    function prizeToEth(uint256 amount) public payable {
        uint256 userBalance = prizeToken.balanceOf(msg.sender);
        if (amount > userBalance) revert MouseGame__underfunded();
        prizeToken.burn(msg.sender, amount);
        uint256 prizeTokenValue = getPrizeTokenValue();
        uint256 ethToSend = amount * prizeTokenValue;
        (bool sent, ) = msg.sender.call{value: ethToSend}("");

        if (!sent) revert MouseGame__trasactionFail();
    }

    function isRegistered(address player) internal view returns (bool) {
        for (uint i = 0; i < s_players.length; i++) {
            if (s_players[i] == player) return true;
        }
        return false;
    }

    function getPrizeTokenValue() public view returns (uint256 ethAmount) {
        uint256 prizeTokenTotalSupply = prizeToken.totalSupply();
        uint256 thisBalance = address(this).balance;

        return thisBalance / prizeTokenTotalSupply;
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
