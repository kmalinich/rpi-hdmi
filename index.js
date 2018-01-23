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
		let cmd;

		switch (state) {
			case true : cmd = cmds.vc.on; break;
			default   : cmd = cmds.vc.off;
		}

		let child = spawn(bins.vc, [ cmd ]);

		child.stdout.on('error', (error) => {
			this.emit('error', error);
		});

		child.on('close', (code) => {
			this.emit('command', {
				command : cmd.replace(/-/g, '').trim(),
				exit    : code,
			});
		});

		this.status();
	}
}

module.exports = rpi_hdmi;
