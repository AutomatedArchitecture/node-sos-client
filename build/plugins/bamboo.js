var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var request = require('request');
var PluginBase = require('../plugin');

var Bamboo = (function (_super) {
    __extends(Bamboo, _super);
    function Bamboo() {
        _super.apply(this, arguments);
    }
    Bamboo.prototype.poll = function (config, callback) {
        var _this = this;
        var opts = {
            auth: {
                username: config.username,
                password: config.password
            }
        };
        request.get(config.url, opts, function (err, resp) {
            if (err) {
                return callback(err);
            }
            var bambooResp = JSON.parse(resp.body);
            if (bambooResp.results.result.length > 0) {
                var status = bambooResp.results.result[0];
                return callback(null, {
                    status: _this.toPollResultStatus(status.state),
                    id: status.id
                });
            }
            return callback();
        });
    };

    Bamboo.prototype.toPollResultStatus = function (state) {
        state = state.toLowerCase();
        if (state == 'successful') {
            return PluginBase.PollResultStatus.SUCCESS;
        }
        console.error("unknown bamboo state:", state);
        return PluginBase.PollResultStatus.FAILURE;
    };
    return Bamboo;
})(PluginBase.PluginBase);
exports.Bamboo = Bamboo;

