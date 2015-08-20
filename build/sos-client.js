/// <reference path="./external-ts-definitions/node.d.ts" />
/// <reference path="./external-ts-definitions/async.d.ts" />
/// <reference path="./external-ts-definitions/sos-device.d.ts" />
var fs = require('fs');
var async = require('async');
var sos = require('sos-device');
var PluginBase = require('./plugin');
var Bamboo = require('./plugins/bamboo');
var Jenkins = require('./plugins/jenkins');
var TeamCity = require('./plugins/teamcity');

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
            status: 0 /* SUCCESS */,
            id: '0'
        };
        switch (build.type) {
            case 'bamboo':
                build.plugin = new Bamboo.Bamboo();
                break;
            case 'jenkins':
                build.plugin = new Jenkins.Jenkins();
                break;
            case 'teamcity':
                build.plugin = new TeamCity.TeamCity();
                break;
            default:
                return callback(new Error("Invalid build type: " + build.type));
        }
        process.nextTick(pollBuild.bind(null, build, startupData));
    });
    return callback();
}

function pollBuild(build, startupData) {
    //console.log('polling build:', build.name);
    build.plugin.poll(build.config, function (err, pollResult) {
        if (err) {
            console.error('Failed to poll: ' + build.name, err);
        }
        if (pollResult) {
            if (pollResult.status !== build.lastPollResult.status || pollResult.id !== build.lastPollResult.id) {
                build.lastPollResult = pollResult;
                console.log('New poll results:', pollResult, build.lastPollResult);
                updateSiren(startupData, build.lastPollResult);
            }
        }
        setTimeout(pollBuild.bind(null, build, startupData), build.interval);
    });
}

function getOnSuccessConfigOrDefault(startupData) {
    if (startupData.config.onSuccess) {
        return startupData.config.onSuccess;
    }

    return {
        "audioPatternIndex": 1,
        "audioDuration": 500,
        "ledPatternIndex": 0,
        "ledPlayDuration": 500
    };
}

function getOnFailConfigOrDefault(startupData) {
    if (startupData.config.onFail) {
        return startupData.config.onFail;
    }

    return {
        "audioPatternIndex": 0,
        "audioDuration": 1000,
        "ledPatternIndex": 0,
        "ledPlayDuration": 5000
    };
}

function getMode(patterns, patternIndex) {
    if (patternIndex === null)
        return null;
    return patterns[patternIndex].id;
}

function playConfig(sosDeviceInfo, playConfig, sosDevice) {
    var controlPacket = {
        audioMode: getMode(sosDeviceInfo.audioPatterns, playConfig.audioPatternIndex),
        audioPlayDuration: playConfig.audioDuration,
        ledMode: getMode(sosDeviceInfo.ledPatterns, playConfig.ledPatternIndex),
        ledPlayDuration: playConfig.ledPlayDuration
    };
    console.log(controlPacket);
    sosDevice.sendControlPacket(controlPacket, function (err) {
        if (err) {
            console.error("Could not send SoS control packet", err);
        }
    });
}

function updateSiren(startupData, pollResult) {
    var sosDevice = startupData.sosDevice;
    var sosDeviceInfo = startupData.sosDeviceInfo;

    if (pollResult.status === 1 /* FAILURE */) {
        var onFailConfig = getOnFailConfigOrDefault(startupData);
        playConfig(sosDeviceInfo, onFailConfig, sosDevice);
    } else if (pollResult.status === 0 /* SUCCESS */) {
        var onSuccessConfig = getOnSuccessConfigOrDefault(startupData);
        playConfig(sosDeviceInfo, onSuccessConfig, sosDevice);
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
//# sourceMappingURL=sos-client.js.map
