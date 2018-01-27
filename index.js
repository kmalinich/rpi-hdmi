/* eslint no-useless-escape : 0 */

const { spawn }    = require('child_process');
const EventEmitter = require('events');

const path_vc = '/opt/vc/bin';

const bins = {
	tv : path_vc + '/tvservice',
	vc : path_vc + '/vcgencmd',
	vt : {
		get : 'fgconsole',
		set : 'chvt',
	},
};

const cmds = {
	tv : {
		off    : [ '--off'       ],
		on     : [ '--preferred' ],
		status : [ '--status'    ],
	},
	vc : {
		off    : [ 'display_power', '0' ],
		on     : [ 'display_power', '1' ],
		status : [ 'display_power'      ],
	},
};

// Needs additional states added
let states = {
	tv : {},
	vc : {},
};


states.tv[0x120002] = false;
states.tv[0x120006] = true;

states.vc[0] = false;
states.vc[1] = true;


// Should eventually implement data from here
// https://github.com/raspberrypi/userland/blob/master/interface/vmcs_host/vc_hdmi.h#L468

function status_parse(output) {
	let split;

	output = output.trim();
	split  = output.split(/[\s=()\[\],@]+/);

	let type;
	switch (split[0]) {
		case 'state' : { // tvservice output
			type = 'tv';
			break;
		}

		case 'display_power' : { // vcgencmd output
			type = 'vc';
			break;
		}

		default : { // fgconsole/chvt output
			type = 'vt';
		}
	}

	let state_num;
	switch (type) {
		case 'tv' : {
			state_num = parseInt(split[1]);

			switch (state_num) {
				case 0x120002 : {
					return {
						type   : type,
						status : {
							group       : null,
							mode        : null,
							power       : states.tv[state_num],
							progressive : null,
							ratio       : null,
							refreshrate : null,
							resolution  : null,
							state       : parseInt(split[1]),
						},
					};
				}

				default : {
					return {
						type   : type,
						status : {
							group       : split[3],
							mode        : parseInt(split[4]),
							power       : states.tv[state_num],
							progressive : (split[10] === 'progressive'),
							ratio       : split[7],
							refreshrate : parseInt(String(split[9]).replace('Hz', '')),
							resolution  : split[8],
							state       : parseInt(split[1]),
						},
					};
				}
			}
		}

		case 'vc' : {
			state_num = parseInt(split[1]);

			return {
				type   : type,
				status : {
					power : states.vc[state_num],
				},
			};
		}

		case 'vt' : {
			return {
				type   : type,
				status : {
					tty : parseInt(split[0]),
				},
			};
		}
	}
}


class rpi_hdmi extends EventEmitter {
	// Get current status from fgconsole, tvservice, vcgencmd
	status() {
		let children = {
			tv : spawn(bins.tv,     cmds.tv.status),
			vc : spawn(bins.vc,     cmds.vc.status),
			vt : spawn(bins.vt.get, cmds.vc.status),
		};


		let output = {
			tv : '',
			vc : '',
			vt : '',
		};


		children.tv.stdout.on('data', (data) => {
			output.tv += data.toString();
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});

		children.vt.stdout.on('data', (data) => {
			output.vt += data.toString();
		});


		children.tv.on('close', (code) => {
			let status;

			status      = status_parse(output.tv);
			status.code = code;

			this.emit('status', status);
		});

		children.vc.on('close', (code) => {
			let status;

			status      = status_parse(output.vc);
			status.code = code;

			this.emit('status', status);
		});

		children.vt.on('close', (code) => {
			let status;

			status      = status_parse(output.vt);
			status.code = code;

			this.emit('status', status);
		});
	}

	power(state) {
		let cmd = {
			tv : null,
			vc : null,
		};


		switch (state) {
			case true : {
				cmd.tv = cmds.tv.on;
				cmd.vc = cmds.vc.on;
				break;
			}

			default : {
				cmd.tv = cmds.tv.off;
				cmd.vc = cmds.vc.off;
			}
		}


		let children = {
			tv : spawn(bins.tv, cmd.tv),
			vc : spawn(bins.vc, cmd.vc),
		};


		let output = {
			tv : '',
			vc : '',
			vt : '',
		};


		children.tv.stdout.on('data', (data) => {
			output.tv += data.toString();
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});


		children.tv.on('close', (code) => {
			this.emit('command', {
				data : output.tv.trim(),
				exit : code,
				type : 'tv',
			});
		});

		children.vc.on('close', (code) => {
			this.emit('command', {
				data : output.vc.trim(),
				exit : code,
				type : 'vc',
			});
		});


		// Switch to VT1, then back to VT8 after powering on
		if (state === true) {
			spawn(bins.vt.set, [ 1 ]);

			setTimeout(() => {
				spawn(bins.vt.set, [ 8 ]);
			}, 500);
		}


		// Call this.status() to update current status
		setTimeout(this.status, 1000);
	}
}

module.exports = rpi_hdmi;
