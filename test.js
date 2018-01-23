/* eslint no-console : 0 */

let hdmi = new (require('./'))();

hdmi.on('command', (data) => {
	console.log('event: command');
	console.log(JSON.stringify(data, null, 2));
	console.log('');
});

hdmi.on('error', (data) => {
	console.log('event: error');
	console.log(JSON.stringify(data, null, 2));
	console.log('');
});

hdmi.on('status', (data) => {
	console.log('event: status');
	console.log(JSON.stringify(data, null, 2));
	console.log('');
});

// Power on
hdmi.power(true);

// Power off after 3 seconds
setTimeout(() => {
	hdmi.power();
}, 5000);
