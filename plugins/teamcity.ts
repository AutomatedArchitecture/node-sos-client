/// <reference path="../external-ts-definitions/request.d.ts" />

import request = require('request');
import PluginBase = require('../plugin');

export class TeamCity extends PluginBase.PluginBase {
    poll(config: any, callback: (err?: Error, pollResult?: PluginBase.PollResult) => void): void {
        return callback(null, {
            status: PluginBase.PollResultStatus.SUCCESS,
            id: "1"
        });
    }
}