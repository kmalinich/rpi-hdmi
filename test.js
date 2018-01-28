/* eslint no-console : 0 */

let hdmi = new (require('./'))();

hdmi.on('command', (data) => {
	data = {
		event : 'command',
		data  : data,
	};

	console.log(JSON.stringify(data, null, 2) + '\n');
});

hdmi.on('error', (data) => {
	data = {
		event : 'error',
		data  : data,
	};

	console.log(JSON.stringify(data, null, 2) + '\n');
});

hdmi.on('status', (data) => {
	data = {
		event : 'status',
		data  : data,
	};

	console.log(JSON.stringify(data, null, 2) + '\n');
});


// Get status
hdmi.status();

// Power on after 3 seconds
setTimeout(() => { hdmi.power(true); }, 3000);

// Power off after 6 seconds
setTimeout(() => { hdmi.power(false); }, 6000);
