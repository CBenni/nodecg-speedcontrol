'use strict';
var needle = require('needle');
var nodecg = require('./utils/nodecg-api-context').get();

var requestOptions = {
	headers: {
		'Authorization': ''
	}
};

if (nodecg.bundleConfig && nodecg.bundleConfig.tiltify && nodecg.bundleConfig.tiltify.enable) {
	if (!nodecg.bundleConfig.tiltify.key) {
		nodecg.log.warn('Tiltify support is enabled but no API key is set.');
		return;
	}
	
	nodecg.log.info('Tiltify integration is enabled.');
	var donationTotal = nodecg.Replicant('tiltifyDonationTotal', {persistent:false, defaultValue:0});
	requestOptions.headers['Authorization'] = 'Token token="'+nodecg.bundleConfig.tiltify.key+'"';
	
	// Do the initial request, which also checks if the key is valid.
	needle.get('https://tiltify.com/api/v2/campaign', requestOptions, (err, resp) => {
		if (resp.statusCode === 401) {
			nodecg.log.warn('Your Tiltify API key is not valid.');
			return;
		}
		
		getDonationTotal(resp.body);
		setInterval(getUpdates, 30000); // Checks every 30 seconds.
	});
}

function getUpdates() {
	needle.get('https://tiltify.com/api/v2/campaign', requestOptions, (err, resp) => {
		if (!err && resp.statusCode === 200)
			getDonationTotal(resp.body);
	});
}

function getDonationTotal(data) {
	// Update the donation total replicant if it has actually changed.
	if (donationTotal.value !== data.total_raised)
		donationTotal.value = data.total_raised;
}