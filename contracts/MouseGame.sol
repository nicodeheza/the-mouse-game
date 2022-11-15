// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./CheeseToken.sol";
import "./PrizeToken.sol";
import "./RandomNumber.sol";
import "./MouseNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error MouseGame__inscriptionClose();
error MouseGame__underpayment();
error MouseGame__alreadyRegistered();
error MouseGame__notReadyToStart();
error MouseGame__overpaid();
error MouseGame__trasactionFail();
error MouseGame__tryAgainLater();
error MouseGame__gameInProgress();
error MouseGame__underfunded();
error MouseGame__OnlyReferee();

contract MouseGame is RandomNumber, Ownable {
    struct Winner {
        uint256 balance;
        address player;
    }

    uint256 constant ENTRANCE_FEE = 0.0014 ether;
    uint256 constant INSCRIPTION_LIMIT = 10 minutes;
    uint256 constant GAME_DURATION = 2 hours;
    uint256 constant CHEESE_INITIAL_AMOUNT = 240;
    uint256 constant MAX_PLAYERS = 10;
    uint256 constant MIN_PLAYERS = 3;
    uint256 constant REFEREE_INITIAL_PERCENTAGE = 5;

    address public immutable i_referee;

    address[] private s_players;
    uint256 private s_inscriptionStartTime;
    uint256 private s_gameStartTime;
    mapping(address => uint) private s_balance;

    CheeseToken cheeseToken;
    PrizeToken prizeToken;
    MouseNFT mouseNft;

    constructor(
        address linkAddressm,
        address wrapperAddress,
        address uniswapRouterAddress,
        address referee
    ) RandomNumber(linkAddressm, wrapperAddress, uniswapRouterAddress) {
        i_referee = referee;
    }

    event playerInscribed(uint256 indexed time, address player);
    event gameStarted(uint256 indexed time, address firstMouseOwner);
    event gameReverted();
    event gameEnded(address indexed player, uint256 playerPrize);
    event gameWinner(address winner);
    event prizeSwaped(address indexed player, uint256 prize, uint256 eth);
    event refereeWithdrawEvent(uint256 amount);

    function inscribe() public payable {
        if (getInscriptionTimeLeft() == 0 || s_players.length >= MAX_PLAYERS) {
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

        emit playerInscribed(block.timestamp, msg.sender);
    }

    function startGame() public onlyReferee {
        if (getInscriptionTimeLeft() > 0) revert MouseGame__notReadyToStart();
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

        emit gameStarted(block.timestamp, mouseOwner);
    }

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

        s_inscriptionStartTime = 0;
        emit gameReverted();
    }

    function endGame() public onlyReferee {
        if (getGameTimeLeft() > 0) {
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
            mintPrize(player, playerCheeseBalance);

            emit gameEnded(player, playerCheeseBalance);
        }

        uint256 mouseCheeseBalance = cheeseToken.balanceOf(address(mouseNft));
        cheeseToken.transferFrom(
            address(mouseNft),
            address(this),
            mouseCheeseBalance
        );
        mintPrize(winner.player, mouseCheeseBalance);
        mouseNft.burn();

        uint256 startDelay = getDelay(
            s_gameStartTime,
            s_inscriptionStartTime,
            INSCRIPTION_LIMIT
        );
        uint256 endDelay = getDelay(
            block.timestamp,
            s_gameStartTime,
            GAME_DURATION
        );

        uint256 totalMinutesDelay = (startDelay + endDelay) / 60;
        uint256 refereePercentage;
        if (totalMinutesDelay >= REFEREE_INITIAL_PERCENTAGE) {
            refereePercentage = 0;
        } else {
            refereePercentage = refereePercentage - totalMinutesDelay;
        }

        uint256 refereeBalance = (refereePercentage * address(this).balance) /
            100;
        uint256 gameBalance = address(this).balance - refereeBalance;

        s_balance[i_referee] = refereeBalance;
        s_balance[address(this)] = gameBalance;

        s_gameStartTime = 0;
        s_inscriptionStartTime = 0;
        delete s_players;

        emit gameWinner(winner.player);
    }

    function prizeToEth(uint256 amount) public payable {
        uint256 userBalance = prizeToken.balanceOf(msg.sender);
        if (amount > userBalance) revert MouseGame__underfunded();
        burnPrize(msg.sender, amount);
        uint256 prizeTokenValue = getPrizeTokenValue();
        uint256 ethToSend = amount * prizeTokenValue;
        s_balance[address(this)] = s_balance[address(this)] - ethToSend;

        (bool sent, ) = msg.sender.call{value: ethToSend}("");

        if (!sent) revert MouseGame__trasactionFail();

        emit prizeSwaped(msg.sender, amount, ethToSend);
    }

    function refereeWithdraw() public payable onlyReferee {
        uint256 amount = s_balance[i_referee];
        s_balance[i_referee] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");

        if (!sent) revert MouseGame__trasactionFail();

        emit refereeWithdrawEvent(amount);
    }

    function isRegistered(address player) internal view returns (bool) {
        for (uint i = 0; i < s_players.length; i++) {
            if (s_players[i] == player) return true;
        }
        return false;
    }

    function getPrizeTokenValue() public view returns (uint256 ethAmount) {
        uint256 prizeTokenTotalSupply = prizeToken.totalSupply();
        uint256 thisBalance = s_balance[address(this)];

        return thisBalance / prizeTokenTotalSupply;
    }

    function mintPrize(address to, uint256 amount) internal {
        prizeToken.mint(to, amount);
    }

    function burnPrize(address owner, uint256 amount) internal {
        prizeToken.burn(owner, amount);
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

    function getGameBalance() public view returns (uint256) {
        return s_balance[address(this)];
    }

    function getRefereeBalance() public view onlyReferee returns (uint256) {
        return s_balance[i_referee];
    }

    function getDelay(
        uint256 endTime,
        uint256 startTime,
        uint256 duration
    ) internal pure returns (uint256 delay) {
        int delayTime = int(endTime) - int(startTime) - int(duration);
        if (delayTime < 0) delayTime = delayTime * -1;
        return uint256(delayTime);
    }

    function setContracts(
        address mouseNftAddress,
        address cheeseTokenAddress,
        address prizeTokenAddress
    ) external onlyOwner {
        mouseNft = MouseNFT(mouseNftAddress);
        cheeseToken = CheeseToken(cheeseTokenAddress);
        prizeToken = PrizeToken(prizeTokenAddress);
    }

    modifier onlyReferee() {
        if (msg.sender != i_referee) revert MouseGame__OnlyReferee();
        _;
    }
}
