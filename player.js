const template = document.createElement("template");
template.innerHTML = `
<style>
	:host {
		display: inline-block;;
		background: var(--player-bg);
		box-shadow: 0 2px 5px var(--player-shadow);
		padding: 1rem;
		margin: 0.5rem;
	}
</style>

<button>Register device</button>
<h1 id="status"></h1>
<h1 id="points"></h1>
`;

export class Player extends HTMLElement {

	static get observedAttributes () {
		return ["points"];
	}

	set points (val) {
		this.setAttribute("points", val);
		this.$points.innerHTML = `Points: ${val}`;
	}

	get points () {
		return Number(this.getAttribute("points")) || 0;
	}

	constructor () {
		super();

		const shadow = this.attachShadow({mode: "open"});
		shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		const btn = this.shadowRoot.querySelector("button");
		btn.addEventListener("click", this._requestDevice.bind(this));

		this.speakerChar = null;
		this.currentColor = [0, 0, 0];
		this.$status = this.shadowRoot.querySelector("#status");
		this.$points = this.shadowRoot.querySelector("#points");

		this.points = 0;
		this._setStatusText("Register device");
	}

	/**
	 * Notify the player each time the points changes.
	 * @param attr
	 * @param oldValue
	 * @param newValue
	 * @returns {Promise<void>}
	 */
	async attributeChangedCallback (attr, oldValue, newValue) {
		if (attr === "points") {
			const oldPoints = Number(oldValue);
			const newPoints = Number(newValue);

			this.$points.innerHTML = `Points: ${newPoints}`;

			let statusText = "Boooo!";
			if (newPoints > oldPoints) {
				await this._playSound(600);
				statusText = "Congrats!";
			}

			// Set the status text to inform the user what just happened
			this.$status.innerText = statusText;
			setTimeout(() => {
				this.$status.innerText = "Connected!";
			}, 3000);
		}
	}

	/**
	 * Request a device through bluetooth.
	 * @returns {Promise<void>}
	 * @private
	 */
	async _requestDevice () {
		try {
			this._setStatusText("Connecting...");

			// Request the dvice
			const device = await navigator.bluetooth.requestDevice({
				filters: [{services: ["ef680100-9b35-4933-9b10-52ffa9740042"]}],
				optionalServices: [
					"ef680200-9b35-4933-9b10-52ffa9740042",
					"ef680300-9b35-4933-9b10-52ffa9740042",
					"ef680400-9b35-4933-9b10-52ffa9740042",
					"ef680500-9b35-4933-9b10-52ffa9740042"
				]
			});

			// Waait for the server to connect
			const server = await device.gatt.connect();

			// Listen for changes in the acceleration
			const accService = await server.getPrimaryService("ef680400-9b35-4933-9b10-52ffa9740042");
			const accChar = await accService.getCharacteristic("ef68040a-9b35-4933-9b10-52ffa9740042");
			accChar.addEventListener("characteristicvaluechanged", this._onAccelData.bind(this));
			await accChar.startNotifications();

			// Get access to the speaker
			const speakerService = await server.getPrimaryService("ef680500-9b35-4933-9b10-52ffa9740042");
			this.speakerChar = await speakerService.getCharacteristic("ef680502-9b35-4933-9b10-52ffa9740042");

			this._setStatusText("Connected!");

		} catch (e) {
			// No device was selected.
			console.log(e);
		}
	}

	/**
	 * Sets the status text.
	 * @param text
	 * @private
	 */
	_setStatusText (text) {
		this.$status.innerText = text;
	}

	/**
	 * Sets the points text.
	 * @param points
	 * @private
	 */
	_updatePointssText (points) {
		this.$points.innerHTML = `Points: ${points}`;
	}

	/**
	 * Sets the current color.
	 * @param color
	 * @private
	 */
	_setCurrentColor ([r, g, b]) {
		this.currentColor = [r, g, b];
		this.shadowRoot.host.setAttribute("style", `background: rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);
	}

	/**
	 * Updates the color based on the acceleration data.
	 * @param evt
	 * @private
	 */
	_onAccelData (evt) {
		const x = evt.target.value.getFloat32(0, true);
		const y = evt.target.value.getFloat32(4, true);
		const z = evt.target.value.getFloat32(8, true);

		const r = Math.abs(x + 10) / 20 * 255;
		const g = Math.abs(y + 10) / 20 * 255;
		const b = Math.abs(z + 10) / 20 * 255;

		this._setCurrentColor([r, g, b]);
	}

	async _playSound (hz) {
		let frequency = hz;
		let duration = 500;
		let sound = new Uint8Array(5);
		sound[0] = frequency & 0xFF;
		sound[1] = (frequency >> 8) & 0xFF;
		sound[2] = duration & 0xFF;
		sound[3] = (duration >> 8) & 0xFF;
		sound[4] = 300;

		let mode = new Uint8Array(2);
		mode[0] = 1;
		mode[1] = 1;

		await this.speakerChar.writeValue(sound);
	}
}

window.customElements.define("wbt-player", Player);
