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
            return callback(null, _this.toPollResult(teamCityResponse, config));
        });
    };

    TeamCity.prototype.contains = function (list, item) {
        for (var i = 0; i < list.length; i++) {
            var listItem = list[i];
            if (listItem === item)
                return true;
        }
        return false;
    };

    TeamCity.prototype.getWatchedBuilds = function (response, config) {
        if (config.buildTypes === undefined)
            return response;

        var filteredBuilds = { build: [] };
        for (var i = 0; i < response.build.length; i++) {
            var build = response.build[i];
            if (this.contains(config.buildTypes, build.buildTypeId)) {
                filteredBuilds.build.push(build);
            }
        }
        return filteredBuilds;
    };

    TeamCity.prototype.toPollResult = function (response, config) {
        var watchedBuilds = this.getWatchedBuilds(response, config);

        if (watchedBuilds.build.length === 0) {
            return {
                id: "AllBuildTypes",
                status: 0 /* SUCCESS */
            };
        } else {
            return {
                id: watchedBuilds.build[0].id.toString(),
                status: 1 /* FAILURE */
            };
        }
    };
    return TeamCity;
})(PluginBase.PluginBase);
exports.TeamCity = TeamCity;
//# sourceMappingURL=teamcity.js.map
