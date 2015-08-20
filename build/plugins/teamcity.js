/// <reference path="../external-ts-definitions/request.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var request = require('request');
var PluginBase = require('../plugin');
var PollResultStatus = PluginBase.PollResultStatus;

var TeamCity = (function (_super) {
    __extends(TeamCity, _super);
    function TeamCity() {
        _super.apply(this, arguments);
    }
    TeamCity.prototype.poll = function (config, callback) {
        var _this = this;
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
        request.get(config.url, opts, function (err, resp) {
            if (err) {
                return callback(err);
            }
            console.log(resp.body);
            var teamCityResponse = resp.body;
            return callback(null, {
                status: _this.toPollResultStatus(teamCityResponse.status),
                id: teamCityResponse.id.toString(10)
            });
        });
    };

    TeamCity.prototype.toPollResultStatus = function (status) {
        if (status === 'SUCCESS')
            return 0 /* SUCCESS */;
        if (status === 'FAILURE')
            return 1 /* FAILURE */;
        if (status === 'ERROR') {
            console.error("error state returned from team city");

            // when the server is down for maintenance just pretend that is passed, for now
            return 0 /* SUCCESS */;
        }
        console.error("unexpected response from team city: " + status);
        return 1 /* FAILURE */;
    };
    return TeamCity;
})(PluginBase.PluginBase);
exports.TeamCity = TeamCity;
//# sourceMappingURL=teamcity.js.map
