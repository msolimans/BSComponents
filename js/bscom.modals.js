window.bscom = window.bscom || {};

window.bscom.modals = (function () {

    var counter = 0, $modals = [], name = "smodal-", hasTimers = false,
        $modal = $(
            '<div data-refresh="true" class="modal fade" id="modalWindow"  role="dialog" aria-labelledby="modalLabel" aria-hidden="true">' +
            '<div class="modal-dialog ">' +
            '<div class="modal-content">' +

            //header and body should be injected here

            '</div>' +
            '</div>' +
            '</div>');

    //it is like peek without any pop from the stack/array
    var getCurrent = function () {
        if (counter > 0)
            return $modals[counter - 1];

        return undefined;
    };

    //set the value of the last elem in the array
    var setCurrent = function (elem) {
        if (counter > 0)
            $modals[counter - 1] = elem;
    };

    var getClassByType = function (type) {
        if (!type)
            return "";

        switch (type.toLowerCase()) {
            case "info":
                return " alert alert-info";
            case "warning":
                return " alert alert-warning";
            case "danger":
                return " alert alert-danger";
            case "success":
                return " alert alert-success";
            default:
                return "";
        }
    };

    var getDefaultClass = function (type, btnName) {
        switch (btnName.toLowerCase()) {
            case "ok":
            case "okay":
            case "yup":
            case "yeap":
            case "yeah":
            case "yep":
            case "yes":
                return "btn btn-" + type;
            default:
                return "btn btn-secondary";
        }
    };

    var toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).replace(/([A-Z])/g, " $1");
        });
    };

    var injectButtons = function (elem) {

        if (elem.buttons) {
            var result = '<div class="modal-footer">';
            for (var button in elem.buttons) {
                result += '<button ' +
                    ' data-action="' + button + '"' +
                    ' type="button"' +
                    ' class="' + (elem.buttons[button].class ? elem.buttons[button].class : getDefaultClass(elem.type, button) ) + '"' +
                    '>' +
                    toTitleCase(button) +
                    '</button>';
            }

            result += '</div>';

            return result;
        }

        return '';

    };


    var injectModalInfo = function (elem) {

        var $div = elem.window.find("div.modal-content");

        //clear previous content if exists
        $div.empty();

        $div.html(
            '<div class="modal-header' + getClassByType(elem.type) + '">' +
            '<h5 class="modal-title">' + //text text-' + elem.type +
            elem.title + //where the title should be injected
            '</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body">' +
            elem.body.replace(/\{\{(c|counter|cc)\}\}/gi, "<span id='" + elem.id + "-counter'></span>") + //where the real content of the modal should be injected
            '</div>' +
            injectButtons(elem) //where buttons are going in the footer
        );

    };

    var callFunc = function (cb, $mw, args) {
        if (!cb) return;

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

    };

    var bindKb = function () {
        //check select2 issue wth tab-index=-1|0|1
        //https://www.bountysource.com/issues/1098490-select2-bootstrap-modal-weird-scrolling
        alert("test");

    };

    var Counting = function () {
        this.algorithm = undefined;
    };

    Counting.prototype = {
        setStrategy: function (algorithm) {
            this.algorithm = algorithm;
            return this; //chaining
        },
        draw: function ($c, count) {
            if (this.algorithm) {
                return this.algorithm.draw($c, count);
            }
        }
    };

    var ProgressBar = function () {
        this.draw = function ($c, count) {
            //count is total here
            var scale = 100/count;

            $c.html("<div class=\"progress\">\n" +
                "  <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\" style=\"width: " + scale + "%\" aria-valuenow=\"" + scale + "\" aria-valuemin=\"0\" aria-valuemax=\"100\"></div>");

            var i = scale;
            var interval = setInterval(function () {
                i+=scale;
                if (i >= 100)
                    clearInterval(interval);
                $c.html("<div class=\"progress\">\n" +
                    "  <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\" style=\"width: " + i + "%\" aria-valuenow=\"" + i + "\" aria-valuemin=\"0\" aria-valuemax=\"" + count + "\"></div>");
            }, 1000);
        }
    };

    var CountUp = function () {
        this.draw = function ($c, count) {
            //count is total here
            $c.text("1 out of " + count);
            var i = 1;
            var interval = setInterval(function () {
                if (++i === count)
                    clearInterval(interval);
                $c.text(i + " out of " + count);
            }, 1000);

        }
    };

    var CountDown = function () {
        this.draw = function ($c, count) {
            //count is start point here
            $c.text(count);

            var interval = setInterval(function () {
                if (count === 0)
                    clearInterval(interval);

                $c.text(--count);
            }, 1000);


        }
    };

    var injectCounter = function($c, timer){
        if(!timer.type || timer.type === "progressbar" || timer.type === "pg")
            new Counting().setStrategy(new ProgressBar()).draw($c, timer.count  / 1000);
        else if(timer.type === "countdown" || timer.type === "-1" || timer.type === -1)
            new Counting().setStrategy(new CountDown()).draw($c, timer.count / 1000);
        else if(timer.type === "countup" || timer.type === "1" || timer.type === 1)
            new Counting().setStrategy(new CountUp()).draw($c, timer.count / 1000);
    };


    var registerEvents = function (elem) {

        var $mw = elem.window, data = elem.data, cb = elem.cb, hiddenCb = elem.hcb;

        //register shown event, set the width of popup according to the size md, lg
        $mw.off("show.bs.modal").on("show.bs.modal", function (e) {

            if ($(this)) {
                var $modalDialog = $(this).find(".modal-dialog");

                //if ($modalDialog.prop("class").indexOf("modal-lg") > -1) {
                //    //$(this).find('.modal-dialog').css('overflow-y', 'auto');
                //    $modalDialog.css('width', $(window).width() * 0.90);

                //} else if ($modalDialog.prop("class").indexOf("modal-md") > -1) {
                //    $modalDialog.css('width', $(window).width() * 0.60);
                //}
                $modalDialog.removeClass("modal-xs").removeClass("modal-sm").removeClass("modal-md").removeClass("modal-lg").removeClass("modal-xl");

                getCurrent().size = getCurrent().size || "md";

                switch (getCurrent().size.toLowerCase()) {

                    case "sm":
                    case "xs":
                        $modalDialog.addClass("modal-sm");
                        break;
                    case "md":
                        $modalDialog.addClass("modal-md");
                        break;
                    case "lg":
                        $modalDialog.addClass("modal-lg");
                        break;
                    case "xl":
                        $modalDialog.addClass("modal-xl");
                        break;
                }

                //populate properties into form automatically otherwise put all remaining data (json format) inside "data" attribute
                if (data && data.autoPopulate)
                    for (var k in data) {
                        if (data.hasOwnProperty(k) && k.toLowerCase() !== "autopopulate") {
                            var $e = $(e.currentTarget).find("#" + k);
                            if ($e && $e.length > 0) {
                                $e = $e.first().val(data[k]);
                            }
                        }
                    }
                else
                    $modalDialog.data("data", JSON.stringify(data));

            }


        });

        //after shown event, set the height of popup and call callback function
        $mw.off("shown.bs.modal").on("shown.bs.modal", function (e) {
            $(this).find(".modal-dialog").css("max-height", $(window).height() * 0.90);
            var elem = getCurrent();
            if (elem.timer && elem.timer.count) {
                var $c = $(this).find("#" + elem.id + "-counter");
                if ($c && $c.length > 0) {

                    injectCounter($c, elem.timer);

                }
            }

            callFunc(cb, $(e.currentTarget));

        });

        //no content is removed until replaced by another window (keep it to get any values from window)
        $mw.off("hidden.bs.modal").on("hidden.bs.modal", function (e) {

            var elem = getCurrent();

            if (hiddenCb) {
                callFunc(hiddenCb, $(e.currentTarget), elem ? elem.rdata : undefined);
            }


            //remove the last elem (we don't need it anymore) - we should not remove timeout ones
            //in case there is an error in aliveRequest, we should stop the timer which means we should call the following block as we don't need this popup anymore!
            if (!elem.timer) {
                //console.log("popout");
                $modals.pop();
                counter--;
                $mw.find("div.modal-content").html("");
            } else {
                showModal();
            }

        });
    };

    var tickShow = function (indx) {

        console.log("ticked");
        if ($modals.length - 1 > indx) {
            //shifting: move out this window in indx to the last element
            var elem = $modals[indx];

            for (var i = indx; i < $modals.length - 1; i++) {
                $modals[i] = $modals[i + 1];
            }
            $modals[$modals.length - 1] = elem;
        }

        //show the modal window and return it for further processing if needed
        var elem = getCurrent();
        if (elem.timerId) {
            //once shown/display, it's not valid to reset its timer anymore (delay its display) as it is already shown!
            delete  elem.timerId;
            setCurrent(elem);
            //hasTimers = false;
            if (elem.timer && !elem.timer.ignoreUserActivity)
                unRegisterTimerEvents();
        }


        elem.window.modal({
            show: true,
            keyboard: elem.keyoard || elem.kb || true,
            focus: true
        });

    };

    var showModal = function (injectedBefore) {

        var elem = getCurrent();

        if (!injectedBefore) {
            injectModalInfo(elem);


            //register events for callbacks and sizes
            registerEvents(elem);
        }

        //register timing ticks and timer events in case only the current window is of type timer
        if (elem.timer && elem.timer.after) {
            //bind is used here to be able pass param to function wrapped within setTimeout()
            //save timerId in case we need to reset it later
            elem.timerId = setTimeout(tickShow.bind(null, $modals.length - 1), elem.timer && elem.timer.after || 0);
            //hasTimers = true;
            if (!elem.timer.ignoreUserActivity)
                registerTimerEvents();
            setCurrent(elem);
        }
        else
            tickShow($modals.length - 1);

        return elem.window;

    };

    var merge = function (obj1, obj2) {

        for (var k in obj2) {
            obj1[k] = obj2[k];
        }

        return obj1;
    };


    var postbackData = function (data) {
        //we can still use $.extend(elem.rdata, data) to merge both in rdata
        var elem = getCurrent();
        if (elem) {
            if (elem.rdata && Object.keys(elem.rdata).length > 0) {
                elem.rdata = merge(elem.rdata, data);
            }
            else {
                elem.rdata = data;
            }

            setCurrent(elem);


        }
    };

    /*Event Handlers ------------------------------------------------------------------------------------------------*/

    function registerTimerEvents() {

        $(document).on("keyup mouseup", function () {
            //if (hasTimers)
            for (var i = 0; i < $modals.length; i++) {

                var elem = $modals[i];
                clearTimeout(elem.timerId);
                elem.timerId = setTimeout(tickShow.bind(null, i), elem.timer && elem.timer.after || 0);
                setCurrent(elem);
            }

        });

    }

    function unRegisterTimerEvents() {
        $(document).off("keyup mouseup");
    }


    $(document).on("click", ".modal-cancel", function () {
        exports.close();
    });

    $(document).on("click", "*[data-toggle='modal']", function () {
        var $this = $(this);
        onModalBtnClick($this);
    });

    $(document).on("click", "*[data-action]", function () {


        var elem = getCurrent();

        //clear counter timeout first if exists
        if (elem.timer && elem.timer.sto) {
            clearTimeout(elem.timer.sto);
            delete elem.timer.sto;
        }

        //close window
        try {
            exports.close();
        } catch (ex) {
            console.log(ex);
        }

        //call the action here
        var button = elem.buttons[$(this).data("action")];

        if (!button)
            return;

        switch (typeof button) {
            case "object":
                callFunc(button.action);
                break;
            default:
                //functionName (string) or function
                callFunc(button);
                break;
        }
    });

    /*---------------------------------------------------------------------------------------------------------------*/


    var onModalBtnClick = function ($this) {
        //data-ajax                 (bring up the ajax url and display the results inside the modal)
        //data-title                title of the popup to be displayed
        //data-message              message of the popup to be displayed (in case we did not specify ajax)
        //data-callback             (called after shown)
        //data-hidden-callback      (called after closed)
        //data-...                  (Any other data that need to be populated to the ajax url 'form' - it will be pushed automatically and displayed in the inputs there - keep the names consistent to work correctly)

        var $data = {};
        $.extend($data, $this.data());

        var title = $data.title || "Info";
        delete $data.title;

        var size = $data.size || $data.sz || "md";
        delete $data.size;
        delete $data.sz;

        var ajax = $data.ajax || null;
        delete $data.ajax;

        var body = $data.message || $data.body || null;
        delete $data.body;
        delete $data.message;

        var cb = $data.callback || $data.cb || undefined;
        delete $data.callback;
        delete $data.cb;

        var hcb = $data.hiddenCallback || $data.hCb || undefined;
        delete $data.hiddenCallback;
        delete $data.hCb;

        /*data-kb, data-type="confirm|info|warning|simple|err" data-buttons-ok="functionName" data-buttons-ok-class="className"  data-buttons-cancel="action" data-buttons-cancel-class="" */
        var kb = $data.kb || $data.keyboard || true;
        delete $data.kb;
        delete $data.keyboard;

        if (!ajax && !body)
            body = "Please specify either ajax url [data-ajax] or message [data-message|data-body] to be displayed in this window";

        if (!body) {
            //call ajax and fill body
            $.get(ajax, function (response) {
                body = response;

                //must be here to make sure response promise is ready after ajax call
                exports.show(title, body, size, $data, cb, hcb);

            });
        }

        else {
            //display message directly
            exports.show(title, body, size, $data, cb, hcb);
        }


    };

    var generateBtn = function (btn, name) {
        //generate okay by default
        if (!btn)
            return {
                okay: {}
            };

        if (btn && (typeof btn === "function" || typeof btn === "string")) {
            var temp = btn;
            btn = {};

            //name not provided, generate names
            if (!name) {
                var current = getCurrent();
                if (!current.btnCounter) {
                    current.btnCounter = 1;

                } else {
                    current.btnCounter += 1;
                }
                setCurrent(current);
                name = "Button " + current.btnCounter;
            }

            btn[name] = {};
            btn[name].action = temp;

        }

        return btn;
    };

    var generateOkay = function (okBtn) {
        return generateBtn(okBtn, "Okay");
    };


    var exports = {
        display: function (options) {
            var opts = {
                title: "Info",
                body: "Please specify either ajax url [data-ajax] or message [data-message|data-body] to be displayed in this window",
                size: "md",
                type: "info",
                timer: undefined,
                data: {},
                rdata: {},
                cb: undefined,
                hcb: undefined,
                window: undefined
            };

            $.extend(opts, options);

            //add new modal to modals array with all properties required
            var $temp = $modal.clone(), cid = name + counter++;

            $temp.attr("id", cid);
            opts.id = cid;
            opts.window = $temp;

            $modals.push(opts);

            showModal();

        },
        timeout: function (title, body) {
            //buttons comes at the end
            //opts => {after: 60 sec, count: 20 sec=> if counter specified it should be displayed inside body, redirect: url (if not specified logout will be used), logout: this is url, live: this is also url}
            var defaults = {
                after: 3 * 1000,//display after 3 secs
                count: 10 * 1000,//count for 3 secs
                alive: "/alive",
                aliveData: {},
                aliveType: undefined,
                aliveRequestType: undefined,
                aliveAjaxType: "GET",
                logout: "/logout",
                login: "/login",
                redirect: undefined,
                onShow: undefined,
                onAliveSuccess: undefined,
                onAliveError: undefined,
                ignoreUserActivity: true,
                type: "-1" /* -1 | countdown, countup | 1 , progressbar */
            };

            var opts = Array.prototype.slice.call(arguments, 2); //exclude first 2 args
            if (!opts || opts.length === 0 || (opts.length === 1 && typeof(opts[0]) === "object")) {
                if (opts[0].after) opts[0].after *= 1000;
                if (opts[0].count) opts[0].count *= 1000;
                opts = $.extend(defaults, opts[0]);
            }
            else {
                var t = {};
                t.after = opts[0];
                t.count = opts[1] || defaults.count;
                t.alive = opts[2] || defaults.alive;
                t.logout = opts[3] || defaults.logout;
                t.redirect = opts[4] || t.logout; //if not specified logout will be used
                t.aliveData = opts[5] || defaults.aliveData;
                t.aliveType = opts[6] || defaults.aliveType;

                opts = t;
            }

            //clone logout in case redirect not passed
            opts.redirect = opts.redirect || opts.logout;

            return exports.confirm(title, body, {
                StayConnected: {
                    class: "btn btn-primary", action: function () {
                        $.ajax({
                            url: opts.alive,
                            type: opts.aliveType || opts.aliveRequestType || opts.aliveAjaxType,
                            data: opts.aliveData,
                            success: function () {
                                if (opts.onAliveSuccess)
                                    callFunc(opts.onAliveSuccess);
                            },
                            error: function (data) {
                                //get current and remove timer (it should not tick again)
                                //TODO: sto should not be stopped in case of error to redirect to redirect url after specified time.. sto should be stopped after action executed
                                //getCurrent().timer = undefined;
                                //make it 1 sec late to allow hidden to be fired and pop last one
                                setTimeout(function () {
                                    exports.info("Error", "Error while trying to refresh your current sessions and you have to login again", {
                                        LoginAgain: {
                                            class: "btn btn-info",
                                            action: function () {
                                                window.location = opts.login;
                                            }
                                        }
                                    });

                                    if (opts.onAliveError)
                                        callFunc(opts.onAliveError);

                                }, 1000);
                            }
                        });

                    }
                },
                Logout: {
                    class: "btn btn-danger", action: function () {
                        //clear timeout that was started
                        window.location = opts.logout;
                    }
                },
                popupConfigs: {
                    timer: opts,
                    onShow: function () {
                        var current = getCurrent();
                        //this is used to set shown time out (after it is shown and no interaction it should redirect to configured "redirect" url (like you have been signed out due to inactivity or session timeout)
                        current.timer.sto = setTimeout(function () {
                            window.location = opts.redirect;
                        }, opts.count);
                        setCurrent(current);
                    }
                }

            });
        },

        //e.g. buttons: { Yes: {class: "btn btn-success", action: function(){ ... } }, No: { action: function(){ ... } } }
        //e.g. buttons: { Yes: function(){alert('test');} }
        //e.g. buttons: { Yes: "myFunctionName" }
        confirm: function (title, body) {
            var btns = Array.prototype.slice.call(arguments, exports.confirm.length);

            var timer = undefined;
            var onShow = undefined;

            if (btns.length === 1) {
                timer = btns[0].popupConfigs && btns[0].popupConfigs.timer;
                onShow = btns[0].popupConfigs && btns[0].popupConfigs.onShow;
                delete btns[0].popupConfigs;
            }

            if (!btns || btns.length === 0) {
                return exports.info(title, body);
            }

            var temp = {};
            //first and second only
            temp = $.extend(temp, generateBtn(btns[0], "Yes"));

            //Generate NO in case we have only length of ONE and it is of type string/function or (object and has only one key)
            if (btns.length === 1) {
                if (typeof(btns[0]) === 'string' || typeof(btns[0]) === 'function' || (typeof(btns[0]) === "object" && Object.keys(btns[0]).length === 1))
                    temp = $.extend(temp, generateBtn({no: {}}));
            }
            else
            //greater than 1, generate sec button
                temp = $.extend(temp, generateBtn(btns[1], "No"));

            //generate rest of btns if any
            for (var i = 2; i < btns.length; i++) {
                temp = $.extend(temp, generateBtn(btns[i]));
            }

            return exports.display({
                title: title,
                body: body,
                buttons: temp,
                type: "danger",
                timer: timer,
                cb: onShow
            });
        },
        warning: function (title, body, btn) {
            return exports.display({
                title: title,
                body: body,
                buttons: generateOkay(btn),
                type: "warning"
            });
        },
        success: function (title, body, btn) {
            return exports.display({
                title: title,
                body: body,
                buttons: generateOkay(btn),
                type: "success"
            });
        },
        info: function (title, body, btn) {
            return exports.display({
                title: title,
                buttons: generateOkay(btn),
                body: body
            });
        },
        err: function (title, body, btn) {
            return exports.display({
                title: title,
                buttons: generateOkay(btn),
                body: body,
                type: "danger"
            });
        },
        simple: function (title, body, btn) {
            return exports.display({
                title: title,
                buttons: generateOkay(btn),
                body: body,
                type: "primary"
            });
        },

        show: function (title, body, size, data, cb, hiddenCb) {
            //add new modal to modals array with all properties required
            var $temp = $modal.clone(), cid = name + counter++;
            $temp.attr("id", cid);
            $modals.push({
                id: cid,
                title: title,
                body: body,
                size: size,
                data: data,
                rdata: {},
                cb: cb,
                hcb: hiddenCb,
                window: $temp
            });

            showModal();

        },

        close: function () {
            var $cmodal = getCurrent().window;
            $cmodal.modal("hide");
        },

        postData: function (data) {
            postbackData(data);
        }
    };

    //outside world
    return {
        close: exports.close,
        hide: exports.close,
        postData: exports.postData,
        open: exports.show,
        show: exports.show,
        simple: exports.simple,
        info: exports.info,
        inform: exports.info,
        err: exports.err,
        error: exports.err,
        warn: exports.warning,
        warning: exports.warning,
        success: exports.success,
        confirm: exports.confirm,
        timeout: exports.timeout
    };

})();