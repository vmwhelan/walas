var Zone = require('../models/zone');
var http = require('http');
var stringify = require('json-stringify');
var rp = require('request-promise');
const walasUrl = "http://walas.home/?getVars";

// gets is_on and is_muted from arduino - needs to be called by an exported function
//function systemStatus(req,body){
function systemStatus(body){
    var arr = body.split("*");
    var mute;
    var status;
    //var id = req.params.id;
    var id = 0;

    if (arr[1] == 0){mute=false;} else {mute=true;}
    if (arr[14] == 0){status=false;} else {status=true;}
    var obj = {"_id" : parseInt(id), "is_on" : status, "is_muted" : mute};
    return obj;
}

//gets volume and mute status for requested zone from ?getVars on arduino
function getVars(req, body) {
    var arr = body.split("*");
    var mute;
    var vol;
    var id = req.params.id; //.toString();
    switch (id) {
        case "1":
            if (arr[2] == 0) {
                mute = false;
            } else {
                mute = true;
            }
            vol = parseInt(arr[3]);
            break;
        case "2":
            if (arr[4] == 0) {
                mute = false;
            } else {
                mute = true;
            }
            vol = parseInt(arr[5]);
            break;
        case "3":
            if (arr[6] == 0) {
                mute = false;
            } else {
                mute = true;
            }
            vol = parseInt(arr[7]);
            break;
    }
    var obj = {"_id" : parseInt(id), "is_muted" : mute, "volume" : vol};
    return obj;
}

// GET request called from /zones
// returns json of database values for all zones
exports.listZoneDatabase = function(req,res) {
    Zone.find({}, (err,zone) => {
        if (err) {
            res.send(err);
        }
        res.json(zone);
    });
};

// PUT request called from /zones,
// gets data from arduino and updates database
exports.updateZoneDatabase = function(req,res){
  rp(walasUrl).then(function(body){
    var arr = body.split("*");
    var walasObj = {
      "zones": [
        {"id" : 0, "is_muted" : !!+(arr[1]), "is_on" : !!+(arr[14])},
        {"id" : 1, "is_muted" : !!+(arr[2]), "volume" : parseInt(arr[3])},
        {"id" : 2, "is_muted" : !!+(arr[4]), "volume" : parseInt(arr[5])},
        {"id" : 3, "is_muted" : !!+(arr[6]), "volume" : parseInt(arr[7])}
      ]
    };
    return walasObj;
  }).then(function(walasObj){
    Zone.findById(walasObj.zones[0].id, function(err,zone){
      if(err){
        res.send(err);
      }
      zone.is_on = walasObj.zones[0].is_on;
      zone.is_muted = walasObj.zones[0].is_muted;
      zone.save(function(err){
        if (err) {
          res.send(err);
        }
      });
    });
    return walasObj;
  }).then(function(walasObj){
    for (var i = 1; i < 4; i++){
      updateZone(walasObj.zones[i]);
    }
    res.json(walasObj);
  });
}

// Called from updateZoneDatabase, updates each zone in loop
function updateZone(zoneObj){
  console.log("updateZone function, zone id = " + zoneObj.id);
  Zone.findById(zoneObj.id, function(err,zone){
    console.log("id = " + zoneObj.id + ", is_muted = " + zoneObj.is_muted + ", volume = " + zoneObj.volume)
    if(err){
      res.send(err);
    }
    if (zoneObj.id == 0){
      zone.is_on = zoneObj.is_on;
    }
    zone.is_muted = zoneObj.is_muted;
    zone.volume = zoneObj.volume;
    zone.save(function(err){
      if (err){
        res.send(err);
      }
    });
  });
}

// PUT request called from /zone/:id/volume/:mod
// updates the volume/mute status on the arduino for the requested zone
exports.changeVolume = function(req,res){
  rp(walasUrl).then(function(body){
    var zoneObj
    var pathURL
    // If zone is 0 (System/Walas)
    if (req.params.id == 0){
      switch(req.params.mod){

        // If :mod = "mute"
        case "mute":
          //zoneObj = systemStatus(req,body); //Get current zone info from arduino
          zoneObj = systemStatus(body); //Get current zone info from arduino
          Zone.findById(req.params.id,function(err,zone){ //find corresponding db entry for zone 0
            if (err) { res.send(err); }     //if error, return error message, else
            rp("http://walas.home/?m0");    //send GET request to arduino to mute/unmute system
            if(zoneObj.is_muted == true){   //if system was muted then
              zone.is_muted = false;          //update db to is_muted = false
              zone.save(function(err){        //save db change, send error or json
                  if (err){ res.send(err); }
                  res.json({"message" : "System Unmute Successful!"});
              });
            } else {                        //if system was unmuted then
              zone.is_muted = true;           //update db to is_muted = true
              zone.save(function(err){        //save db change, send error or json
                if (err){ res.send(err); }
                res.json({"message" : "System Mute Successful!"});
              });
            }
          });
          break;

        // If :mod is anyting other than "mute"
        default:
          res.json({"error" : "Invalid request."}); //send error message
      } //end switch

    // If zone = 1 to 3 (the only valid zones)
    } else if (req.params.id <= 3){
      zoneObj = getVars(req,body);              //get current zone info from arduino
      Zone.findById(req.params.id,function(err,zone){ //find corresponding db entry for zone
        if (err) { res.send(err); }               //if error, return error message
        switch(req.params.mod){                   //otherwise

          // If :mod = "mute"
          case "mute":
            rp("http://walas.home/?m" + req.params.id);   //send GET request to arduino to mute/unmute zone
            if (zoneObj.is_muted == true) {               //if zone was muted
              zone.is_muted = false;                        //update is_muted db entry for zone to false
              zone.save(function(err){                      //save db change, return error or json
                if (err){ res.send(err); }
                res.json({"message" : "Unmute Successful!"});
              });
            } else {                                      //if zone was unmuted
              zone.is_muted = true;                         //update is_muted db entry for zone to true
              zone.save(function(err){                      //save db change, return error or json
                if (err){ res.send(err); }
                res.json({"message" : "Mute Successful!"});
              });
            }
            break;

          // If :mod = "up" or "down"
          case "up":
          case "down":
            var newVol = volumeUpDown(req.params.mod,zoneObj);    //return new volume value from function volumeUpDown
            rp("http://walas.home/?v" + req.params.id + newVol);  //send GET request to arduino to update zone volume
            zone.volume = newVol;                                 //update volume in db
            zone.save(function(err){                              //save db change, return error or json
              if (err){ res.send(err); }
              if (req.params.mod == "up") {
                res.json({"message": "Volume Up Successful!", "volume" : "-" + newVol + " db"});
              } else {
                res.json({"message": "Volume Down Successful!", "volume" : "-" + newVol + " db"});
              }
            });
            break;
          /*case "down":
            var newVol = volumeUpDown("down",zoneObj);
            rp("http://walas.home/?v" + req.params.id + newVol);
            res.json({"message": "Volume Down Successful!", "volume": "-" + newVol + " db"});
            break;*/

            // If :mod is anything else (i.e., a volume value)
            default:
              if (isNaN(req.params.mod)){                   //if :mod is not a number
                res.json({"error" : "Invalid request."});   //return error message
              }                                             //otherwise
              var newVol = parseInt(req.params.mod);        //convert new volume value from :mod to integer
              if (newVol < 0 || newVol > 78) {              //if new volume is <0 or >78, return error
                res.json({"error" : "Invalid request.  Volume must be between 0 and 78."});
              /*
              } else if (newVol > 78){
                res.json({"error" : "Invalid request.  Volume must be between 0 and 78."});
              */
            } else {                                                  //otherwise
                rp("http://walas.home/?v" + req.params.id + newVol);  //send GET request to arduino to update zone volume
                zone.volume = newVol;                                 //update db with new volume
                zone.save(function(err){                              //save db change, return error or json
                  if (err){ res.send(err); }
                  res.json({"message": "Volume Change Successful!", "volume": "-" + newVol + " db"});
                });
              }
        } //end switch
      });
    }
  });
}

// Adjusts the volume on the arduino for the given zone
function volumeUpDown(mod,zoneObj){
    var val
    if (mod == "up"){
        if (zoneObj.volume - 2 < 0){
            val = 0
        } else {
            val = zoneObj.volume - 2
        }
    } else if (mod == "down") {
        if (zoneObj.volume + 2 > 78){
            val = 78
        } else {
            val = zoneObj.volume + 2
        }
    }
    return val;
}

// GET request called from /zone/:id
// returns the arduino data (not db data) for the requested zone
exports.zonesFromWalas = function (req, res) {
    rp(walasUrl).then(function (body) {
        if (req.params.id == 0){
            //res.json(systemStatus(req, body));
            res.json(systemStatus(body));
        } else {
            res.json(getVars(req, body));
        }
    }).catch(function(err){
      if (err) {
        res.send(err);
      }
    });
}

// GET request called from /zone/:id/update
// updates database with data for requested zone
exports.updateZoneDataById = function(req,res){
    rp(walasUrl).then(function(body){
        var zoneObj
        if (req.params.id == 0){
            //zoneObj = systemStatus(req,body);
            zoneObj = systemStatus(body);
            Zone.findById(req.params.id,function(err,zone){
                if (err) {
                    res.send(err);
                }
                zone.is_on = zoneObj.is_on;
                zone.is_muted = zoneObj.is_muted;

                zone.save(function(err){
                    if (err){
                        res.send(err);
                    }
                    res.json(zoneObj);
                });
            });
        } else {
            zoneObj = getVars(req,body);
            Zone.findById(req.params.id,function(err,zone){
                if (err) {
                    res.send(err);
                }
                zone.volume = zoneObj.volume;
                zone.is_muted = zoneObj.is_muted;

                zone.save(function(err){
                    if(err){
                        res.send(err);
                    }
                    res.json(zoneObj);
                });
            });
        }
    });
}

exports.systemOnOff = function(req,res){
  const walUrl = "http://walas.home/";

  /*var sysObj = rp(walasUrl).then(function(body){
    systemStatus(body);
  });*/

  if (req.params.io == "on") {
    rp(walUrl + "?on").then(function(req,res){
      updateZone({"id" : 0, "is_on" : true, "is_muted" : false, "volume" : 78});
    });
    res.json({"message" : "On"});
  } else if (req.params.io == "off") {
    rp(walUrl + "?off").then(function(req,res){
      updateZone({"id" : 0, "is_on" : false, "is_muted" : false, "volume" : 78});
    });
    res.json({"message" : "Off"});
  } else {
    res.json({"message" : "Invalid Request"});
  }
}

// returns zone volume for GET from /zone/:id/volume
// also updates database with that data
exports.getZoneVolume = function(req,res){
    rp(walasUrl).then(function(body){
        var zoneObj
        if (req.params.id == 0){
            var msg = {"message" : "No overall volume.  Try a different zone."}
            res.json(msg);
        } else {
            zoneObj = getVars(req,body);
            Zone.findById(req.params.id,function(err,zone){
                if (err) {
                    res.send(err);
                }
                zone.volume = zoneObj.volume;
                zone.is_muted = zoneObj.is_muted;

                zone.save(function(err){
                    if(err){
                        res.send(err);
                    }
                    var obj = {"volume" : zoneObj.volume}
                    res.json(obj);
                });
            });
        }
    });
}


////TEMPLATES BELOW FROM EXAMPLES

// Display Zone create form on GET
exports.zone_create_get = function(req,res) {
    let newZone = new Zone(req.body);

    newZone.save((err, zone) => {
        if (err) {
            res.send(err);
        }
        res.json(zone);
    });
};

// Handle Zone create on POST
exports.zone_create_post = function(req,res) {
    let newZone = new Zone(req.body);

    newZone.save((err, zone) => {
        if (err) {
            res.send(err);
        }
        res.json(zone);
    });
};

// Display Zone delete form on GET
exports.zone_delete_get = function(req,res) {
    res.send('NOT IMPLEMENTED: Zone delete GET');
};

// Handle Zone delete on POST
exports.zone_delete_post = function(req,res) {
    res.send('NOT IMPLEMENTED: Zone delete POST');
};

/*
// Display Zone update form on GET
exports.zone_update_get = function(req,res) {
    res.send('NOT IMPLEMENTED: Zone update GET');
};
*/

// Handle Zone update on POST
exports.zone_update_post = function(req,res) {
    res.send('NOT IMPLEMENTED: Zone update POST');
};
