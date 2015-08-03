/// <reference path="../external-ts-definitions/request.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var PluginBase = require('../plugin');

var TeamCity = (function (_super) {
    __extends(TeamCity, _super);
    function TeamCity() {
        _super.apply(this, arguments);
    }
    TeamCity.prototype.poll = function (config, callback) {
        return callback(null, {
            status: 0 /* SUCCESS */,
            id: "1"
        });
    };
    return TeamCity;
})(PluginBase.PluginBase);
exports.TeamCity = TeamCity;
//# sourceMappingURL=teamcity.js.map
