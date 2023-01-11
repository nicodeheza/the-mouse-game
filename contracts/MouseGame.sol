// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./CheeseToken.sol";
import "./PrizeToken.sol";
import "./RandomNumber.sol";
import "./MouseNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

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

    uint256 private ENTRANCE_FEE;
    uint256 private immutable INSCRIPTION_LIMIT;
    uint256 private immutable GAME_DURATION;
    uint256 constant CHEESE_INITIAL_AMOUNT = 240;
    uint256 constant MAX_PLAYERS = 10;
    uint256 constant MIN_PLAYERS = 3;
    uint256 constant REFEREE_INITIAL_PERCENTAGE = 5;
    uint256 constant OWNER_PERCENTAGE = 5;

    address public immutable i_referee;

    mapping(address => uint256) internal s_balance;
    address[] internal s_players;
    uint256 private s_inscriptionStartTime;
    uint256 private s_gameStartTime;

    CheeseToken cheeseToken;
    PrizeToken prizeToken;
    MouseNFT mouseNft;

    constructor(
        address linkAddressm,
        address VRFCoordinatorAddress,
        address uniswapRouterAddress,
        bytes32 keyHash,
        address referee,
        uint256 entranceFee,
        uint256 inscriptionLimit,
        uint256 gameDuration
    )
        RandomNumber(
            linkAddressm,
            VRFCoordinatorAddress,
            uniswapRouterAddress,
            keyHash
        )
    {
        i_referee = referee;
        ENTRANCE_FEE = entranceFee;
        INSCRIPTION_LIMIT = inscriptionLimit;
        GAME_DURATION = gameDuration;
    }

    event playerInscribed(uint256 indexed time, address player);
    event gameStarted(
        address indexed firstMouseOwner,
        uint256 indexed tokenId,
        uint256 indexed time
    );
    event gameReverted();
    event gameEnded(address indexed winner, uint256 playerPrize);
    event gameWinner(address winner);
    event prizeSwapped(address indexed player, uint256 prize, uint256 eth);
    event refereeWithdrawEvent(uint256 amount);
    event ownerWithdrawEvent(uint256 amount);
    event requestRandomPlayer(uint256 requestId);

    function inscribe() public payable {
        //slither-disable-next-line incorrect-equality
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
        bool success = cheeseToken.transfer(msg.sender, CHEESE_INITIAL_AMOUNT);
        if (!success) revert MouseGame__trasactionFail();

        emit playerInscribed(block.timestamp, msg.sender);
    }

    function startGame() public onlyReferee {
        if (getInscriptionTimeLeft() > 0) revert MouseGame__notReadyToStart();
        if (getGameTimeLeft() < 9999) revert MouseGame__gameInProgress();
        if (s_players.length < MIN_PLAYERS) {
            revertGame();
        } else {
            uint256 requestId = requestRandomWords();
            emit requestRandomPlayer(requestId);
        }
    }

    function fulfillRandomWords(
        uint256,
        uint256[] memory _randomWords
    ) internal override {
        uint256 mouseOwnerIndex = _randomWords[0] % s_players.length;
        address mouseOwner = s_players[mouseOwnerIndex];
        uint256 tokenId = mouseNft.mint(mouseOwner);
        s_gameStartTime = block.timestamp;

        emit gameStarted(mouseOwner, tokenId, block.timestamp);
    }

    function revertGame() internal {
        for (uint i = 0; i < s_players.length; i++) {
            address player = s_players[i];
            s_players[i] = address(0);
            if (player != address(0)) {
                bool success = cheeseToken.transferFrom(
                    player,
                    address(this),
                    CHEESE_INITIAL_AMOUNT
                );
                if (!success) revert MouseGame__trasactionFail();
                (bool sent, ) = payable(player).call{value: ENTRANCE_FEE}("");
                if (!sent) revert MouseGame__tryAgainLater();
            }
        }
        s_inscriptionStartTime = 0;
        emit gameReverted();
    }

    function endGame() external onlyReferee {
        if (getGameTimeLeft() > 0) {
            revert MouseGame__gameInProgress();
        }

        uint256 gameStartTime = s_gameStartTime;
        s_gameStartTime = 0;

        uint256 lastOwnerCheeseBalance = cheeseToken.balanceOf(
            mouseNft.getOwner()
        );
        uint256 mouseCheeseBalance = cheeseToken.balanceOf(address(mouseNft));
        //slither-disable-next-line arbitrary-send-erc20
        bool mouseCheeseSuccess = cheeseToken.transferFrom(
            address(mouseNft),
            address(this),
            mouseCheeseBalance
        );
        if (!mouseCheeseSuccess) revert MouseGame__trasactionFail();

        mouseNft.burn();

        Winner memory winner = Winner(0, address(0));
        for (uint i = 0; i < s_players.length; i++) {
            address player = s_players[i];
            uint256 playerCheeseBalance = cheeseToken.balanceOf(player);
            if (winner.balance < playerCheeseBalance) {
                winner.player = player;
                winner.balance = playerCheeseBalance;
            }
            //slither-disable-next-line arbitrary-send-erc20
            bool success = cheeseToken.transferFrom(
                player,
                address(this),
                playerCheeseBalance
            );
            if (!success) revert MouseGame__trasactionFail();
            mintPrize(player, playerCheeseBalance);
        }

        uint256 numberOfPlayers = s_players.length;
        delete s_players;
        mintPrize(winner.player, mouseCheeseBalance + lastOwnerCheeseBalance);

        uint256 startDelay = getDelay(
            gameStartTime,
            s_inscriptionStartTime,
            INSCRIPTION_LIMIT
        );
        uint256 endDelay = getDelay(
            block.timestamp,
            gameStartTime,
            GAME_DURATION
        );

        console.log(startDelay, endDelay);

        uint256 totalMinutesDelay = (startDelay + endDelay) / 60;
        uint256 refereePercentage;
        if (totalMinutesDelay >= REFEREE_INITIAL_PERCENTAGE) {
            refereePercentage = 0;
        } else {
            refereePercentage = REFEREE_INITIAL_PERCENTAGE - totalMinutesDelay;
        }

        uint256 roundTotalBalance = numberOfPlayers * ENTRANCE_FEE;
        uint256 refereeBalance = (refereePercentage * roundTotalBalance) / 100;
        uint256 ownerBanalnce = (OWNER_PERCENTAGE * roundTotalBalance) / 100;
        uint256 gameBalance = roundTotalBalance -
            (refereeBalance + ownerBanalnce);

        s_balance[i_referee] += refereeBalance;
        s_balance[owner()] += ownerBanalnce;
        s_balance[address(this)] += gameBalance;

        s_inscriptionStartTime = 0;

        emit gameEnded(
            winner.player,
            mouseCheeseBalance + lastOwnerCheeseBalance
        );
    }

    function prizeToEth(uint256 amount) public payable {
        uint256 userBalance = prizeToken.balanceOf(msg.sender);
        if (amount > userBalance) revert MouseGame__underfunded();
        uint256 prizeTokenValue = getPrizeTokenValue();
        uint256 ethToSend = amount * prizeTokenValue;

        s_balance[address(this)] = s_balance[address(this)] - ethToSend;
        burnPrize(msg.sender, amount);

        (bool sent, ) = msg.sender.call{value: ethToSend}("");

        if (!sent) revert MouseGame__trasactionFail();

        emit prizeSwapped(msg.sender, amount, ethToSend);
    }

    function refereeWithdraw() public payable onlyReferee {
        uint256 amount = s_balance[i_referee];
        s_balance[i_referee] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");

        if (!sent) revert MouseGame__trasactionFail();

        emit refereeWithdrawEvent(amount);
    }

    function ownerWithdraw() public payable onlyOwner {
        address owner = owner();
        uint256 amount = s_balance[owner];
        s_balance[owner] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");

        if (!sent) revert MouseGame__trasactionFail();

        emit ownerWithdrawEvent(amount);
    }

    function isRegistered(address player) public view returns (bool) {
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
        //slither-disable-next-line incorrect-equality
        if (s_inscriptionStartTime == 0) return 9999;
        uint256 time = block.timestamp - s_inscriptionStartTime;
        if (time >= INSCRIPTION_LIMIT) return 0;
        return INSCRIPTION_LIMIT - time;
    }

    function getGameTimeLeft() public view returns (uint256) {
        //slither-disable-next-line incorrect-equality
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

    function getOwnerBalance() public view onlyOwner returns (uint256) {
        return s_balance[owner()];
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

    function getEntranceFee() external view returns (uint256 entranceFee) {
        return ENTRANCE_FEE;
    }

    function setEntraceFee(uint256 newEntraceFee) external onlyOwner {
        ENTRANCE_FEE = newEntraceFee;
    }

    function getInscriptionLimit()
        external
        view
        returns (uint256 inscriptionLimit)
    {
        return INSCRIPTION_LIMIT;
    }

    function getGameDuration() external view returns (uint256 gameDuration) {
        return GAME_DURATION;
    }

    function getVRFSubscriptionFunds()
        external
        view
        onlyOwner
        returns (uint256 funds)
    {
        return _getVRFSubscriptionFunds();
    }

    function getVRFSubscriptionId() external view onlyOwner returns (uint64) {
        return _getVRFSubscriptionId();
    }

    modifier onlyReferee() {
        if (msg.sender != i_referee) revert MouseGame__OnlyReferee();
        _;
    }

    receive() external payable {}
}
