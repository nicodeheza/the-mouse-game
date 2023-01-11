# The Mouse Game 🐭

The game was inspired by [this article](https://beincrypto.com/learn/web3-project-ideas/).

This is a learning project that explores different Ethereum protocols, such as ERC20, ERC721, Chainlink VRF and Uniswap. Also this project looks to practice Hardhat and testing. So this code don't seek to be gas efficient or super secure, **this is not production code**.

I didn't upload the code to any testnet or mainnet, and there are not plans to do it for the moment

**Game rules:**

- The game lasts 2 hrs.
- Every player pays an amount to enter the game and receives 240 cheese tokens 🧀.
- Since the first player enters the game there is a 10 minute deadline to enter.
- The maximum number of players are 10 and the minimum are 3.
- One random player receives the mouse NFT 🐁.
- Only one mouse NFT per match.
- Every 30 seconds that the player holds the mouse loses 1 cheese token.
- When the game ends the user with more cheese tokens wins the tokens stolen by the mouse.
- Once the match finishes the mouse toke is burned, the players cheese tokens are swapped for prize tokens 🤑 that can be changed for ETH

All the game actions are handled by a referee account who is in charge of triggering the game action at the correct moment. If the referee does his work correctly he will receive the 5% of the game pool, and lose 1% for every minute delay.

Also the game contract owner is responsible to fund the Chainlink subscription and also receive the 5% of the game pool.
