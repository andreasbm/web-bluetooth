import {randCol, testColor} from "./util.js";

const template = document.createElement("template");
template.innerHTML = `
<button id="start_game">Start game!</button>
<h1 id="counter"></h1>
`;

export class GameController extends HTMLElement {

	set gameDuration (val) {
		this.setAttribute("gameDuration", val);
	}

	get gameDuration () {
		return this.getAttribute("gameDuration");
	}

	constructor () {
		super();

		const shadow = this.attachShadow({mode: "open"});
		shadow.appendChild(template.content.cloneNode(true));

		this.targetColor = randCol();
		this.timer = null;
		this.players = [];

		this.$counter = shadow.querySelector("#counter");
		this.$startBtn = shadow.querySelector("#start_game");

		this.$startBtn.addEventListener("click", this._restart.bind(this));

		window.gameController = this;
	}

	/**
	 * Adds a player to the game.
	 * @param player
	 */
	addPlayer (player) {
		this.players.push(player);
	}

	/**
	 * Resets and restarts a new game.
	 */
	_restart () {
		this.targetColor = randCol();
		this.$startBtn.style.display = "none";
		document.documentElement.style.setProperty(`--target-color`, `rgb(${Math.round(this.targetColor[0])}, ${Math.round(this.targetColor[1])}, ${Math.round(this.targetColor[2])})`);
		this._startTimer();
	}

	/**
	 * Starts the timer controlling the game.
	 * @private
	 */
	_startTimer () {
		if (this.timer != null) clearInterval(this.timer);

		let secsLeft = this.gameDuration;

		// Update the game every second
		this.timer = setInterval(() => {
			this._setCounterText(secsLeft -= 1);

			// Reset the game if the time has run out.
			if (secsLeft <= 0) {
				clearInterval(this.timer);
				this._announceWinner(null);
				this._restart();

			} else if (this._checkForWinner()) {
				this._restart();
			}
		}, 1000);

		this._setCounterText(secsLeft);
	}

	/**
	 * Set the counter text.
	 * @param sec
	 * @private
	 */
	_setCounterText (sec) {
		this.$counter.innerText = `Time left: ${sec}`;
	}

	/**
	 * Checks whether one of the players has won.
	 * @private
	 */
	_checkForWinner () {
		for (const player of this.players) {
			const isWinner = testColor(this.targetColor, player.currentColor);
			console.log(isWinner);
			if (isWinner) {
				this._announceWinner(player);
				return true;
			}
		}

		return false;
	}

	/**
	 * Announce the winner and adjust the points.
	 * @param winner
	 * @private
	 */
	_announceWinner (winner) {
		for (const player of this.players) {
			player.points += (player === winner) ? 1 : -1;
		}
	}
}

window.customElements.define("wbt-game-controller", GameController);


