const { spawn }    = require('child_process');
const EventEmitter = require('events');

const path_vc = '/opt/vc/bin';

const bins = {
	tv : path_vc + '/tvservice',
	vc : path_vc + '/vcgencmd',
};

const cmds = {
	tv : {
		off    : '--off',
		on     : '--preferred',
		status : '--status',
	},
	vc : {
		off    : 'display_power=0',
		on     : 'display_power=1',
		status : 'display_power',
	},
};


class rpi_hdmi extends EventEmitter {
	status() {
		let children = {
			tv : spawn(bins.tv, [ cmds.tv.status ]),
			vc : spawn(bins.vc, [ cmds.vc.status ]),
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
				status : output.tv.trim(),
				type   : 'tv',
			});
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});

		children.vc.on('close', (code) => {
			this.emit('status', {
				exit   : code,
				status : output.vc.trim(),
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
				cmd.vc = cmds.vc.on;
				cmd.tv = cmds.tv.on;
				break;
			}

			default : {
				cmd.vc = cmds.vc.off;
				cmd.tv = cmds.tv.off;
			}
		}

		let children = {
			tv : spawn(bins.tv, [ cmd.tv ]),
			vc : spawn(bins.vc, [ cmd.vc ]),
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
				status : output.tv.trim(),
				type   : 'tv',
			});
		});

		children.vc.stdout.on('data', (data) => {
			output.vc += data.toString();
		});

		children.vc.on('close', (code) => {
			this.emit('status', {
				exit   : code,
				status : output.vc.trim(),
				type   : 'vc',
			});
		});

		this.status();
	}
}

module.exports = rpi_hdmi;
