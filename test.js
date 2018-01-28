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


// Get status
hdmi.status();

// Power on after 3 seconds
setTimeout(() => {
	hdmi.power(true);
}, 3000);

// Power off after 6 seconds
setTimeout(() => {
	hdmi.power();
}, 6000);
