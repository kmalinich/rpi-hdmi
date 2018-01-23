const { spawn }    = require('child_process');
const EventEmitter = require('events');

const path_vc = '/opt/vc/bin';

const bins = {
	tv : path_vc + '/tvservice',
	vc : path_vc + '/vcgencmd',
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

states.tv[0x120002] = 'off';
states.tv[0x120006] = 'on';

states.vc[0] = 'off';
states.vc[1] = 'on';


function status_parse(output, type) {
	output = output.trim();

	let state_num;
	switch (type) {
		case 'tv' : {
			// Needs additional parsing
			state_num = parseInt(output.split(' ')[1]);
			return states.tv[state_num];
		}

		case 'vc' : {
			state_num = parseInt(output.split('=')[1]);
			return states.vc[state_num];
		}
	}
}


class rpi_hdmi extends EventEmitter {
	status() {
		let children = {
			tv : spawn(bins.tv, cmds.tv.status),
			vc : spawn(bins.vc, cmds.vc.status),
		};

		let output = {
			tv : '',
			vc : '',
		};

		children.tv.stdout.on('data', (data) => {
			output.tv += data.toString();
		});

		children.tv.on('close', (code) => {
			this.emit('status', {
				exit   : code,
				status : status_parse(output.tv, 'tv'),
				type   : 'tv',
			});
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});

		children.vc.on('close', (code) => {
			this.emit('status', {
				exit   : code,
				status : status_parse(output.vc, 'vc'),
				type   : 'vc',
			});
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
		};

		children.tv.stdout.on('data', (data) => {
			output.tv += data.toString();
		});

		children.tv.on('close', (code) => {
			this.emit('command', {
				exit   : code,
				status : output.tv.trim(),
				type   : 'tv',
			});
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});

		children.vc.on('close', (code) => {
			this.emit('command', {
				exit   : code,
				status : output.vc.trim(),
				type   : 'vc',
			});
		});

		this.status();
	}
}

module.exports = rpi_hdmi;
