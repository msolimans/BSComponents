(function() {
    var toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).replace(/([A-Z])/g, " $1");
        });
    };

    var callFunc = function (cb, $mw, args) {
        if (cb) {
            if (typeof cb === 'function')
                cb($mw, args);
            //string
            else {
                //call the function name from the string through the window (safer than eval())
                var ncb = window[cb];

                //the whole function is passed as a string
                if (!ncb) {
                    //hookup the code in a closure to disable conflicts and global access
                    eval('(function(){ var f = ' + cb + '; f();})();');
                    return;
                }

                cb = ncb;

                if (cb)
                    cb.apply(null, [$mw, args]);
            }
        }
    };

    return {
        call: callFunc,
        toTitleCase: toTitleCase
    };

})();
