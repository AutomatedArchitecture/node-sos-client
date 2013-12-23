var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var request = require('request');
var PluginBase = require('../plugin');

var Jenkins = (function (_super) {
    __extends(Jenkins, _super);
    function Jenkins() {
        _super.apply(this, arguments);
    }
    Jenkins.prototype.poll = function (config, callback) {
        var _this = this;
        var opts = {
            auth: {
                username: config.username,
                password: config.password
            },
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };
        request.get(config.url, opts, function (err, resp) {
            if (err) {
                return callback(err);
            }
            console.log(resp.body);
            var jenkinsResp = JSON.parse(resp.body);
            var status = "blue";
            jenkinsResp.jobs.forEach(function (job) {
                if (job.color != "blue") {
                    status = job.color;
                }
            });

            return callback(null, {
                status: _this.toPollResultStatus(status),
                id: "1"
            });
        });
    };

    Jenkins.prototype.toPollResultStatus = function (state) {
        state = state.toLowerCase();
        if (state == 'blue') {
            return PluginBase.PollResultStatus.SUCCESS;
        }
        console.error("unknown jenkins state:", state);
        return PluginBase.PollResultStatus.FAILURE;
    };
    return Jenkins;
})(PluginBase.PluginBase);
exports.Jenkins = Jenkins;

