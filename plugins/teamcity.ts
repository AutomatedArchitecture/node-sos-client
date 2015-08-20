/// <reference path="../external-ts-definitions/request.d.ts" />

import request = require('request');
import PluginBase = require('../plugin');
import PollResultStatus = PluginBase.PollResultStatus;

interface ITeamCityResponse {
    id: number;
    status: string;
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
            return callback(null, {
                status: this.toPollResultStatus(teamCityResponse.status),
                id: teamCityResponse.id.toString(10)
            });
        });
    }

    toPollResultStatus(status: string): PollResultStatus {
        if (status === 'SUCCESS') return PollResultStatus.SUCCESS;
        if (status === 'FAILURE') return PollResultStatus.FAILURE;
        if (status === 'ERROR') {
            console.error("error state returned from team city");
            // when the server is down for maintenance just pretend that is passed, for now
            return PollResultStatus.SUCCESS;
        }
        console.error("unexpected response from team city: " + status);
        return PollResultStatus.FAILURE;
    }
}