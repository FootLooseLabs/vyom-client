const router = require('express').Router();

router.post('/network_config', component.addOrUpdateNetworkConfig);


module.exports = router;