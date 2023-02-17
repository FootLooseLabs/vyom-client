const si = require('systeminformation');

const OPERATOR = {
	getSystemInfo: async function() {
	    //console.log(currentSystemInfo);
	    return await si.getAllData('*', '*');
	}
}

export default OPERATOR;