/// <reference path="../external-ts-definitions/request.d.ts" />

import request = module('request');
import PluginBase = module('../plugin');

interface JenkinsJobs {
    name: string;
    url: string;
    color: string;
}

interface JenkinsResponse {
    jobs: JenkinsJobs[];
}

export class Jenkins extends PluginBase.PluginBase {
    poll(config:any, callback:(err?:Error, pollResult?:PluginBase.PollResult) => void):void {
        var opts = {
            auth: {
                username: config.username,
                password: config.password
            },
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };
        request.get(config.url, opts, (err, resp) => {
            if (err) {
                return callback(err);
            }
            console.log(resp.body);
            var jenkinsResp:JenkinsResponse = <JenkinsResponse>JSON.parse(resp.body);
            var status = "blue";
            jenkinsResp.jobs.forEach(function (job) {
                if (job.color != "blue") {
                    status = job.color;
                }
            });

            return callback(null, {
                status: this.toPollResultStatus(status),
                id: "1"
            });
        });
    }

    toPollResultStatus(state:string):PluginBase.PollResultStatus {
        state = state.toLowerCase();
        if (state.indexOf('blue') == 0 || state.indexOf('disabled') == 0 || state.indexOf('aborted') == 0) {
            return PluginBase.PollResultStatus.SUCCESS;
        }
        console.error("unknown jenkins state:", state);
        return PluginBase.PollResultStatus.FAILURE;
    }
}
