const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

const parser = require('fast-xml-parser');
const he = require('he');
const download = require('download-file');

const goBackDays = 100;

const downloadOptions = {
	directory: './drivers',
	filename: 'chromdriver.zip'
};

const seleniumOptions = {
	directory: './drivers',
	filename: 'selenium.jar'
};

const options = {
	attributeNamePrefix: '@_',
	attrNodeName: 'attr', //default is 'false'
	textNodeName: '#text',
	ignoreAttributes: true,
	ignoreNameSpace: false,
	allowBooleanAttributes: false,
	parseNodeValue: true,
	parseAttributeValue: false,
	trimValues: true,
	cdataTagName: '__cdata', //default is 'false'
	cdataPositionChar: '\\c',
	localeRange: '', //To support non english character in tag/attribute values.
	parseTrueNumberOnly: false,
	attrValueProcessor: (a) => he.decode(a, { isAttributeValue: true }), //default is a=>a
	tagValueProcessor: (a) => he.decode(a) //default is a=>a
};

axios
	.get('https://selenium-release.storage.googleapis.com/')
	.then((data) => {
		const jsonObj = parser.parse(data.data, options).ListBucketResult.Contents;
		let items = _.filter(jsonObj, (x) => {
			const date = moment(x.LastModified);
			const today = moment().subtract(goBackDays, 'days');
			return x.Key.includes('selenium-server-standalone') && date.isAfter(today);
		});
		if (items.length === 0) {
			console.log('No releases found for selnium-server-standalone within the last ${goBackDays}');
		} else {
			_.forEach(items, (x) => {
				console.log(`Selenium:`);
				console.log(items);
				download('https://selenium-release.storage.googleapis.com/' + x.Key, downloadOptions, (error) => {
					if (error) throw error;
					console.log('downloaded');
				});
			});
		}
	})
	.catch((error) => console.log(error));

const chromeurl = 'https://chromedriver.storage.googleapis.com/';

let platform = 'linux64';

if (process.platform === 'win32') {
	platform = 'win32';
} else if (process.platform === 'darwin') {
	platform = 'mac64';
}
console.log(`Platform is set to ${platform}`);
axios.get(chromeurl).then((data) => {
	const jsonObj = parser.parse(data.data, options).ListBucketResult.Contents;
	let items = _.filter(jsonObj, (x) => {
		const date = moment(x.LastModified);
		const today = moment().subtract(goBackDays, 'days');
		return x.Key.includes('chromedriver') && date.isAfter(today) && x.Key.includes(platform);
	});
	if (items.length === 0) {
		console.log(`No releases found for chrome driver within the last ${goBackDays} for the current platform.`);
	} else if (items.length > 0) {
		console.log(`Chromedriver:`);
		console.log(items);
		download(chromeurl + items[0].Key, downloadOptions, (error) => {
			if (error) throw error;
			console.log('downloaded');
		});
	}
});
