var fs = require('fs');
var async = require('async');
var sos = require('sos-device');
var PluginBase = require("./plugin");
var Bamboo = require("./plugins/bamboo");

var useMockDevice = false;

function run(callback) {
    async.auto({
        config: readConfig,
        sosDevice: connectToDevice,
        sosDeviceInfo: ['sosDevice', getSosDeviceInfo],
        poll: ['config', 'sosDeviceInfo', poll]
    }, callback);
}

function poll(callback, startupData) {
    var nameId = 0;
    startupData.config.builds.forEach(function (build) {
        build.interval = build.interval || 30000;
        build.name = build.name || (build.type + (nameId++));
        build.lastPollResult = build.lastPollResult || {
            status: PluginBase.PollResultStatus.SUCCESS,
            id: 0
        };
        switch (build.type) {
            case 'bamboo':
                build.plugin = new Bamboo.Bamboo();
                break;
            default:
                return callback(new Error("Invalid build type: " + build.type));
        }
        process.nextTick(pollBuild.bind(null, build, startupData));
    });
    return callback();
}

function pollBuild(build, startupData) {
    console.log('polling build:', build.name);
    build.plugin.poll(build.config, function (err, pollResult) {
        if (err) {
            console.error('Failed to poll: ' + build.name, err);
        }
        if (pollResult) {
            if (pollResult.status != build.lastPollResult.status || pollResult.id != build.lastPollResult.id) {
                build.lastPollResult = pollResult;
                console.log('New poll results:', pollResult);
                updateSiren(startupData.sosDevice, startupData.sosDeviceInfo, build.lastPollResult);
            }
        }
        setTimeout(pollBuild.bind(null, build, startupData), build.interval);
    });
}

function updateSiren(sosDevice, sosDeviceInfo, pollResult) {
    if (pollResult.status == PluginBase.PollResultStatus.FAILURE) {
        var controlPacket = {
            audioMode: sosDeviceInfo.audioPatterns[0].id,
            audioPlayDuration: 1000,
            ledMode: sosDeviceInfo.ledPatterns[0].id,
            ledPlayDuration: 5000
        };
        console.log(controlPacket);
        sosDevice.sendControlPacket(controlPacket, function (err) {
            if (err) {
                console.error("Could not send SoS control packet", err);
            }
        });
    } else if (pollResult.status == PluginBase.PollResultStatus.SUCCESS) {
        var controlPacket = {
            audioMode: sosDeviceInfo.audioPatterns[1].id,
            audioPlayDuration: 500,
            ledMode: sosDeviceInfo.ledPatterns[0].id,
            ledPlayDuration: 500
        };
        console.log(controlPacket);
        sosDevice.sendControlPacket(controlPacket, function (err) {
            if (err) {
                console.error("Could not send SoS control packet", err);
            }
        });
    }
}

function readConfig(callback) {
    fs.readFile('./config.json', 'utf8', function (err, data) {
        if (err) {
            return callback(err);
        }
        var config = JSON.parse(data);
        return callback(null, config);
    });
}

function connectToDevice(callback) {
    if (useMockDevice) {
        return callback(null, {
            readInfo: function (callback) {
                console.log("MOCK SoS: readInfo:");
                return callback(null, {
                    audioMode: 0,
                    audioPlayDuration: 0,
                    externalMemorySize: 0,
                    hardwareType: 0,
                    hardwareVersion: 0,
                    ledMode: 0,
                    ledPlayDuration: 0,
                    version: 0
                });
            },
            readAllInfo: function (callback) {
                console.log("MOCK SoS: readInfo:");
                return callback(null, {
                    audioMode: 0,
                    audioPlayDuration: 0,
                    externalMemorySize: 0,
                    hardwareType: 0,
                    hardwareVersion: 0,
                    ledMode: 0,
                    ledPlayDuration: 0,
                    version: 0,
                    ledPatterns: [
                        { id: 1, name: 'led1' },
                        { id: 2, name: 'led2' }
                    ],
                    audioPatterns: [
                        { id: 1, name: 'audio1' },
                        { id: 2, name: 'audio2' }
                    ]
                });
            },
            sendControlPacket: function (controlPacket, callback) {
                console.log("MOCK SoS: sendControlPacket:", controlPacket);
                return callback();
            },
            readLedPatterns: function (callback) {
                return callback(null, [
                    { id: 1, name: 'led1' },
                    { id: 2, name: 'led2' }
                ]);
            },
            readAudioPatterns: function (callback) {
                return callback(null, [
                    { id: 1, name: 'audio1' },
                    { id: 2, name: 'audio2' }
                ]);
            }
        });
    }
    return sos.connect(function (err, sosDevice) {
        if (err) {
            return callback(err);
        }
        return callback(null, sosDevice);
    });
}

function getSosDeviceInfo(callback, startupData) {
    return startupData.sosDevice.readAllInfo(function (err, deviceInfo) {
        if (err) {
            return callback(err);
        }
        console.log("deviceInfo:", deviceInfo);
        return callback(null, deviceInfo);
    });
}

run(function (err) {
    if (err) {
        console.error(err);
        return process.exit(-1);
    }
    console.log("startup successful");
});

