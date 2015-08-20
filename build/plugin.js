(function (PollResultStatus) {
    PollResultStatus[PollResultStatus["SUCCESS"] = 0] = "SUCCESS";
    PollResultStatus[PollResultStatus["FAILURE"] = 1] = "FAILURE";
})(exports.PollResultStatus || (exports.PollResultStatus = {}));
var PollResultStatus = exports.PollResultStatus;

var PluginBase = (function () {
    function PluginBase() {
    }
    PluginBase.prototype.poll = function (config, callback) {
        throw new Error("abstract method");
    };
    return PluginBase;
})();
exports.PluginBase = PluginBase;
//# sourceMappingURL=plugin.js.map
