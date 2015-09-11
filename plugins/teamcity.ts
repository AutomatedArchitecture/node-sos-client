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
            return callback(null, this.toPollResult(teamCityResponse, config));
        });
    }

    private contains(list, item): boolean {
        for (var i = 0; i < list.length; i++) {
            var listItem = list[i];
            if (listItem === item)
                return true;
        }
        return false;
    }

    private getWatchedBuilds(response: ITeamCityResponse, config): ITeamCityResponse {
        if (config.buildTypes === undefined) return response;

        var filteredBuilds: ITeamCityResponse = { build: [] };
        for (var i = 0; i < response.build.length; i++) {
            var build = response.build[i];
            if (this.contains(config.buildTypes, build.buildTypeId)) {
                filteredBuilds.build.push(build);
            }
        }
        return filteredBuilds;
    }

    private toPollResult(response: ITeamCityResponse, config): PollResult {
        var watchedBuilds = this.getWatchedBuilds(response, config);

        if (watchedBuilds.build && watchedBuilds.build.length > 0) {
            return {
                id: watchedBuilds.build[0].id.toString(),
                status: PollResultStatus.FAILURE
            }
        }

        return {
            id: "AllBuildTypes",
            status: PollResultStatus.SUCCESS
        }
    }
}