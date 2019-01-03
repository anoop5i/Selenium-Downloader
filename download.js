const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

const parser = require('fast-xml-parser');
const he = require('he');
const download = require('download-file');
const downloadOptions = {
	directory: './drivers'
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
			const today = moment().subtract(60, 'days');
			return x.Key.includes('selenium-server-standalone') && date.isAfter(today);
		}).then((it) => {
			console.log(it);
		});
		console.log(items);
		_.forEach(items, (x) => {
			download('https://selenium-release.storage.googleapis.com/' + x.Key, downloadOptions, (error) => {
				if (error) throw error;
				console.log('downloaded');
			});
		});
	})
	.catch((error) => console.log(error));

const chromeurl = 'https://chromedriver.storage.googleapis.com/';
console.log(process.platform);

let platform = 'linux64';
if (process.platform === 'win32') {
	platform = 'win32';
} else if (process.plaform === 'darwin') {
	platform = 'mac64';
}
axios.get(chromeurl).then((data) => {
	const jsonObj = parser.parse(data.data, options).ListBucketResult.Contents;
	let items = _.filter(jsonObj, (x) => {
		const date = moment(x.LastModified);
		const today = moment().subtract(50, 'days');
		return x.Key.includes('chromedriver') && date.isAfter(today) && x.Key.includes(platform);
	});
	console.log(items);
	if (items.length > 0) {
		download(chromeurl + items[0].Key, downloadOptions, (error) => {
			if (error) throw error;
			console.log('downloaded');
		});
	}
});
