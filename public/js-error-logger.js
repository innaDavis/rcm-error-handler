/**
 * js-error-logger
 * @param message
 * @param file
 * @param line
 * @param column
 *
 *
 * Chrome: message, file, line + column, type and trace are available and logged
 *
 * IE 10+ : message, file, type and trace are available and logged, line and column are not available to log
 *
 * Firebox: message, file, type and trace are available and logged, line and column are not available to log
 *
 * Safari: message, file, type and trace are available and logged, line and column are not available to log
 *
 */

// Supports IE9+, Firefox, Chrome, Opera, Safari
if (window.XMLHttpRequest) {

    //send to server
    var log = function (msg, url, lineNo, columnNo, error, type) {
        if (typeof msg === 'object') {
            var args = Array.prototype.slice.call(msg);
            msg = args.toString();
        }

        var description = "located at " + window.location.href;

        var http = new XMLHttpRequest();
        http.open('POST', '/api/rcm-error-handler/client-error', true);
        http.setRequestHeader('Content-Type', 'application/json');
        http.send(JSON.stringify({
            message: msg,
            file: url,
            line: lineNo + ':' + columnNo,
            description: description,
            type: type,
            trace: error
        }));
    };

    //get Internet Explorer version
    function getInternetExplorerVersion() {
        var rv = false; // Return value assumes failure.

        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
                rv = parseFloat(RegExp.$1);
        }

        return rv;
    }


    if (getInternetExplorerVersion() == false || getInternetExplorerVersion() >= 10) {

        if (console) {

            console.originalError = console.error;
            console.error = function (message) {
                //var logger = Function.prototype.bind.call(console.originalError, console);
                //logger.apply(console, arguments);

                var trace;
                var url = "";
                var lineNo;
                var columnNo;
                var type = 'JsError.console.error';

                // available only in chrome, this is the value representing the position of your caller in the error stack.
                var currentStackPosition = 2;

                try {
                    throw new Error("Custom Error");
                } catch (e) {

                    console.originalError.apply(console, arguments);

                    var is_chrome = /chrome/.test(navigator.userAgent.toLowerCase());

                    //if chrome
                    if (is_chrome) {
                        Error["prepareStackTrace"] = function () {
                            return arguments[1];
                        };
                        Error.prepareStackTrace(e, function () {
                        });
                        url = e.stack[currentStackPosition].getFileName();
                        lineNo = e.stack[currentStackPosition].getLineNumber();
                        columnNo = e.stack[currentStackPosition].getColumnNumber();
                        trace = e.stack.toString();
                        trace = trace.split(',');
                        trace.splice(null, 2);
                        trace = trace.join(',');

                    } else if (e.stack.toString().split("\n")[4].search("Anonymous") != -1) {
                        url = e.stack.toString().split("\n")[4];
                        var init = url.indexOf('(');
                        var fin = url.indexOf(')');
                        url = url.substr(init+1,fin-init-1);
                        trace = e.stack.toString();
                        lineNo = 'not available';
                        columnNo = 'not available';
                    } else {
                        url = e.stack.toString().split("\n")[4];
                        trace = e.stack.toString();
                        lineNo = 'not available';
                        columnNo = 'not available';
                    }

                    log(arguments, url, lineNo, columnNo, trace, type);
                }

            };
        }

        window.onerror = function (msg, url, lineNo, columnNo, error) {
            if (error) {
                var trace = 'not available';
            }
            var type = 'JsError.window.onerror';
            log(msg, url, lineNo, columnNo, trace, type);
        };
    }
}
;
