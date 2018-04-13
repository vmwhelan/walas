var express = require('express');
var router = express.Router();

/*
import {
    zone_create_get,
    zone_create_post,
    zone_delete_get,
    zone_delete_post,
    zone_update_get,
    zone_update_post,
    zone_detail,
    zone_list
} from '../controllers/zoneController'

*/
var zoneController = require('../controllers/zoneController');

/// ZONE ROUTES ///
router.get('/', function(req, res) {
    res.json({message: 'WALAS'});
});

// GET request for creating Zone
router.get('/zone/create', zoneController.zone_create_get);

// POST request for creating Zone
router.post('/zone/create', zoneController.zone_create_post);

// GET request to delete Zone
router.get('/zone/:id/delete', zoneController.zone_delete_get);

// POST request to delete Zone
router.post('/zone/:id/delete', zoneController.zone_delete_post);

// GET request to update Zone
//router.get('/zone/:id/update', zoneController.zone_update_get);

// POST request to update Zone
router.post('/zone/:id/update',zoneController.updateZoneDataById);


// GET request for list of all Zones in db
router.get('/zones', zoneController.listZoneDatabase);

// PUT request to update all Zones in db
router.put('/zones', zoneController.updateZoneDatabase);
router.post('/zones', zoneController.updateZoneDatabase);

// GET request to return aruino data (not db data) for one zone
router.get('/zone/:id',zoneController.zonesFromWalas);


router.get('/zone/:id/volume', zoneController.getZoneVolume);

router.put('/zone/:id/volume/:mod', zoneController.changeVolume);
router.post('/zone/:id/volume/:mod', zoneController.changeVolume);

router.put('/zone/:id/update',zoneController.updateZoneDataById);
router.get('/power/:io', zoneController.systemOnOff);



module.exports = router;
