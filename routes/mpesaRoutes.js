const express = require("express");
const router = express.Router();
const mpesaController = require("../controller/mpesaController");

router.get("/accesstoken", mpesaController.getAccessTokenGenerate);
router.post("/stkpush", mpesaController.stkPush);
router.post("/stkpush/callback", mpesaController.stkPushCallback);
router.post("/stkpush/query", mpesaController.stkPushQuery);
router.post('/c2b/register_url', mpesaController.registerUrl);
router.get('/c2b/simulate', mpesaController.simulateTransaction);
router.post('/c2b/confirmation_url', mpesaController.confirmationUrl);
router.post('/c2b/validation_url', mpesaController.validationUrl);
router.post('/b2c/request', mpesaController.b2cRequest);
router.post('/timeout_url', mpesaController.timeoutUrl);
router.post('/result_url', mpesaController.resultUrl);




module.exports = router;
