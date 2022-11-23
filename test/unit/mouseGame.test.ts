import {network} from "hardhat";
import {developmentChains} from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("MouseNFT unit test", function () {
			this.beforeEach();

			describe("inscribe", function () {
				it("revert if registration time expired or the max of players was reached", async function () {});
				it("revert if sin't is pay the exact entrance fee", async function () {});
				it("revert if the player is already reverted", async function () {});
				it("if the player is the first inscribed set the inscription start time", async function () {});
				it("player must be add to the game", async function () {});
				it("the correct amount of cheese token must be transfer to the player", async function () {});
				it("event must be emitted", async function () {});
			});

			describe("startGame", function () {
				it("only the referee can call this function", async function () {});
				it("revert if the inscription time didn't end", async function () {});
				it("if the minimum of player didn't was reach reset the game", async function () {});
				it("the necessary amount of link must be swapped", async function () {});
				it("one random player must receive the mouse nft", async function () {});
				it("star game time must be set", async function () {});
				it("star game time must be set", async function () {});
			});

			describe("endGame", function () {
				it("only the referee can call this function", async function () {});
				it("revert if game didn't end", async function () {});
				it("pick the correct winner", async function () {});
				it("transfer all the player cheese token to the game", async function () {});
				it("send the correct amount of prize tokens to the players", async function () {});
				it("emit an event for all the player with address and their cheese token balance", async function () {});
				it("transfer the mouse nft cheese to the game", async function () {});
				it("send the correct amount of price token to the winner", async function () {});
				it("the mouse nft must be burned", async function () {});
				it("if referee delay is >= to 5 minutes pay 0", async function () {});
				it("if referee delay is = to 2 minutes pay 3%", async function () {});
				it("if referee delay is = to 0 minutes pay 5%", async function () {});
				it("set game balance", async function () {});
				it("set game start time to 0", async function () {});
				it("set inscription start time to 0", async function () {});
				it("remove all players", async function () {});
				it("emit event with the game winner address", async function () {});
			});

			describe("prizeToEth", function () {
				it("revert if user don't have prize tokens", async function () {});
				it("burn the user prize tokens amount", async function () {});
				it("update game balance", async function () {});
				it("send to the user the correct amount of eth", async function () {});
				it("emit event", async function () {});
			});

			describe("refereeWithdraw", function () {
				it("revert if isn't call by the referee", async function () {});
				it("send the correct amount of eth", async function () {});
				it("set the referee balance to 0", async function () {});
				it("emit and event", async function () {});
			});

			describe("isRegistered", function () {
				it("return true if player is registered", async function () {});
				it("return false if player is not registered", async function () {});
			});

			describe("getPrizeTokenValue", function () {
				it("return the correct value", async function () {});
			});

			describe("getInscriptionTimeLeft", function () {
				it("if time is 0 return 9999", async function () {});
				it("if time is grader or equal to inscription limit return 0", async function () {});
				it("return the correct time left", async function () {});
			});

			describe("getGameTimeLeft", function () {
				it("if time is 0 return 9999", async function () {});
				it("if time is grader or equal to inscription limit return 0", async function () {});
				it("return the correct time left", async function () {});
			});

			describe("getGameBalance", function () {
				it("the game balance", async function () {});
			});

			describe("getGameBalance", function () {
				it("revert if isn't call by the referee", async function () {});
				it("the referee balance", async function () {});
			});
	  });
