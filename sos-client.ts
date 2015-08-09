/// <reference path="./external-ts-definitions/node.d.ts" />
/// <reference path="./external-ts-definitions/async.d.ts" />
/// <reference path="./external-ts-definitions/sos-device.d.ts" />

import fs = require('fs');
import async = require('async');
import sos = require('sos-device');
import PluginBase = require('./plugin');
import Bamboo = require('./plugins/bamboo');
import Jenkins = require('./plugins/jenkins');
import TeamCity = require('./plugins/teamcity');

var useMockDevice: boolean = false;

interface IConfigBuild {
    name: string;
    type: string;
    interval: number;
    config?: any;
    plugin: PluginBase.PluginBase;
    lastPollResult?: PluginBase.PollResult;
}

interface IConfig {
    builds: IConfigBuild[];
}

interface IStartupData {
    config: IConfig;
    sosDevice: SosDevice;
    sosDeviceInfo: SosDeviceAllInfo;
}

function run(callback: (err: Error) => void): void {
    async.auto({
        config: readConfig,
        sosDevice: connectToDevice,
        sosDeviceInfo: ['sosDevice', getSosDeviceInfo],
        poll: ['config', 'sosDeviceInfo', poll]
    }, callback);
}

function poll(callback: (err?: Error) => void, startupData: IStartupData): void {
    var nameId: number = 0;
    startupData.config.builds.forEach((build) => {
       build.interval = build.interval || 30000;
        build.name = build.name || (build.type + (nameId++));
        build.lastPollResult = build.lastPollResult || {
            status: PluginBase.PollResultStatus.SUCCESS,
            id: '0'
        };
       switch(build.type) {
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

function pollBuild(build: IConfigBuild, startupData: IStartupData): void {
    //console.log('polling build:', build.name);
    build.plugin.poll(build.config, (err?, pollResult?: PluginBase.PollResult) => {
        if(err) {
            console.error('Failed to poll: ' + build.name, err);
        }
        if(pollResult) {
            if(pollResult.status !== build.lastPollResult.status
                || pollResult.id !== build.lastPollResult.id) {
                build.lastPollResult = pollResult;
                console.log('New poll results:', pollResult, build.lastPollResult);
                updateSiren(startupData, build.lastPollResult);
            }
        }
        setTimeout(pollBuild.bind(null, build, startupData), build.interval);
    });
}

function getOnSuccessConfigOrDefault(startupData: any) {
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

function getMode(patterns, patternIndex?: number)
{
    if (patternIndex === null) return null;
    return patterns[patternIndex].id;
}

function updateSiren(startupData : IStartupData, pollResult: PluginBase.PollResult) {
    var sosDevice = startupData.sosDevice;
    var sosDeviceInfo = startupData.sosDeviceInfo;

    var controlPacket:SosDeviceControlPacket;
    if(pollResult.status === PluginBase.PollResultStatus.FAILURE) {
        controlPacket = {
            audioMode: sosDeviceInfo.audioPatterns[0].id,
            audioPlayDuration: 1000,
            ledMode: sosDeviceInfo.ledPatterns[0].id,
            ledPlayDuration: 5000
        };
        console.log(controlPacket);
        sosDevice.sendControlPacket(controlPacket, (err?) => {
            if(err) {
                console.error("Could not send SoS control packet", err);
            }
        });
    } else if(pollResult.status === PluginBase.PollResultStatus.SUCCESS) {
        var onSuccessConfig = getOnSuccessConfigOrDefault(startupData);

        controlPacket = {
            audioMode: getMode(sosDeviceInfo.audioPatterns, onSuccessConfig.audioPatternIndex),
            audioPlayDuration: onSuccessConfig.audioDuration,
            ledMode: getMode(sosDeviceInfo.ledPatterns, onSuccessConfig.ledPatternIndex),
            ledPlayDuration: onSuccessConfig.ledPlayDuration
        };
        console.log(controlPacket);
        sosDevice.sendControlPacket(controlPacket, (err?) => {
            if(err) {
                console.error("Could not send SoS control packet", err);
            }
        });
    }
}

function readConfig(callback: (err: Error, config?: IConfig) => void): void {
    fs.readFile('./config.json', 'utf8', (err, data) => {
        if(err) {
            return callback(err);
        }
        var config: IConfig = JSON.parse(data);
        return callback(null, config);
    });
}

function connectToDevice(callback: (err: Error, sosDevice?: SosDevice) => void): void {
    if(useMockDevice) {
        return callback(null, {
            readInfo: (callback: (err?: Error, deviceInfo?: SosDeviceInfo) => void) => {
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
            readAllInfo(callback: (err?: Error, deviceInfo?: SosDeviceAllInfo) => void) {
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
            sendControlPacket(controlPacket: SosDeviceControlPacket, callback?: (err?: Error) => void) {
                console.log("MOCK SoS: sendControlPacket:", controlPacket);
                return callback();
            },
            readLedPatterns(callback: (err?: Error, ledPatters?: SosDeviceLedPattern[]) => void) {
                return callback(null, [
                    { id: 1, name: 'led1' },
                    { id: 2, name: 'led2' }
                ]);
            },
            readAudioPatterns(callback: (err?: Error, audioPatters?: SosDeviceAudioPattern[]) => void) {
                return callback(null, [
                    { id: 1, name: 'audio1' },
                    { id: 2, name: 'audio2' }
                ]);
            }
        });
    }
    return sos.connect((err?, sosDevice?) => {
        if(err) {
            return callback(err);
        }
        return callback(null, sosDevice);
    });
}

function getSosDeviceInfo(callback: (err?: Error, sosDeviceInfo?: SosDeviceAllInfo) => void, startupData: IStartupData): void {
    return startupData.sosDevice.readAllInfo((err?, deviceInfo?) => {
        if(err) {
            return callback(err);
        }
        console.log("deviceInfo:", deviceInfo);
        return callback(null, deviceInfo);
    });
}

run(err => {
    if(err) {
        console.error(err);
        return process.exit(-1);
    }
    console.log("startup successful");
});
