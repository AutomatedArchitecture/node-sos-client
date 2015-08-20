/// <reference path="../external-ts-definitions/request.d.ts" />

import request = require('request');
import PluginBase = require('../plugin');
import PollResultStatus = PluginBase.PollResultStatus;
import PollResult = PluginBase.PollResult;

interface IBuild {
    id: number;
    buildTypeId: string;
    status: string;
}

interface ITeamCityResponse {
    build: IBuild[]
}

export class TeamCity extends PluginBase.PluginBase {
    poll(config: any, callback: (err?: Error, pollResult?: PluginBase.PollResult) => void): void {
        var opts = {
            auth: {
                username: config.username,
                password: config.password
            },
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            json: true
        };
        request.get(config.url, opts, (err, resp) => {
            if (err) {
                return callback(err);
            }
            console.log(resp.body);
            var teamCityResponse: ITeamCityResponse = <ITeamCityResponse>resp.body;
            return callback(null, this.toPollResult(teamCityResponse));
        });
    }

    private toPollResult(response: ITeamCityResponse): PollResult {
        if (response.build.length === 0) {
            return {
                id: "AllBuildTypes",
                status: PollResultStatus.SUCCESS
            }
        } else {
            return {
                id: response.build[0].id.toString(),
                status: PollResultStatus.FAILURE
            }
        }
    }
}