window.bscom = window.bscom || {};

window.bscom.modals = (function () {

    var counter = 0, $modals = [], name = "smodal-",
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
    }

    var setCurrent = function (elem) {
        if (counter > 0)
            $modals[counter - 1] = elem;
    }

    var injectModalInfo = function ($contentDiv, title, body) {

        $contentDiv.html(

            '<div class="modal-header">' +
            '<h3 class="modal-title">' +
            title + //where the title should be injected
            '</h3>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body">' +
            body + //where the real content of the modal should be injected
            '</div>'
        );

    }


    var registerEvents = function ($mw, data, cb, hiddenCb) {

        //register shown event, set the width of popup according to the size md, lg
        $mw.off('show.bs.modal').on('show.bs.modal', function (e) {

            if ($(this)) {
                var $modalDialog = $(this).find(".modal-dialog");

                //if ($modalDialog.prop("class").indexOf("modal-lg") > -1) {
                //    //$(this).find('.modal-dialog').css('overflow-y', 'auto');
                //    $modalDialog.css('width', $(window).width() * 0.90);

                //} else if ($modalDialog.prop("class").indexOf("modal-md") > -1) {
                //    $modalDialog.css('width', $(window).width() * 0.60);
                //}
                $modalDialog.removeClass("modal-xs").removeClass("modal-sm").removeClass("modal-md").removeClass("modal-lg").removeClass("modal-xl");

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
            $(this).find('.modal-dialog').css('max-height', $(window).height() * 0.90);

            callFunc(cb, $(e.currentTarget));

        });

        //no content is removed until replaced by another window (keep it to get any values from window)
        $mw.off("hidden.bs.modal").on("hidden.bs.modal", function (e) {

            if (hiddenCb) {
                var elem = getCurrent();

                callFunc(hiddenCb, $(e.currentTarget), elem ? elem.rdata : undefined);

                //remove the last elem (we don't need it anymore')
                $modals.pop();
                counter--;
                //if (typeof hiddenCb === 'function')
                //    hiddenCb($(e.currentTarget), elem ? elem.rdata : undefined);
                //else {
                //    window[hiddenCb].apply(null, [$(e.currentTarget), elem ? elem.rdata : undefined]);
                //}
            }
            $mw.find("div.modal-content").html("");

        });
    }


    var callFunc = function (cb, $mw, args) {
        if (cb) {
            if (typeof cb === 'function')
                cb($mw, args);
            else {
                //call the function from the string through the window (safer than eval())
                cb = window[cb];
                if (cb)
                    cb.apply(null, [$mw, args]);
            }
        }
    }
    var showModal = function () {

        var elem = getCurrent();

        var $div = elem.window.find("div.modal-content");

        //type
        //remove previous content
        $div.empty();

        //set the content here inside the modal
        //$div.html(responseText);
        injectModalInfo($div, elem.title, elem.body);

        //register events for callbacks and sizes
        registerEvents(elem.window, elem.data, elem.cb, elem.hcb);

        //show the modal window and return it for further processing if needed
        elem.window.modal('show');
        return elem.window;

    }

    var merge = function (obj1, obj2) {

        for (var k in obj2) {
            obj1[k] = obj2[k];
        }

        return obj1;
    }


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
    }


    var exports = {
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
        //same as show (just naming)
        open: function (title, body, size, data, cb, hiddenCb) {
            return exports.show(title, body, size, data, cb, hiddenCb);
        },
        simple: function (title, body) {
            return exports.show(title, body, "sm");
        },
        hide: function () {
            var $cmodal = getCurrent().window;
            $cmodal.modal('hide');
        },
        //same as hide (just naming)
        close: function () {
            exports.hide();
        },
        postData: function (data) {
            postbackData(data);
        }
    };


    $(document).on("click", ".modal-cancel", function () {
        exports.close();
    });

    $(document).on("click", "*[data-toggle='modal']", function () {
        //data-ajax                 (bring up the ajax url and display the results inside the modal)
        //data-title                title of the popup to be displayed
        //data-message              message of the popup to be displayed (in case we did not specify ajax)
        //data-callback             (called after shown)
        //data-hidden-callback      (called after closed)
        //data-...                  (Any other data that need to be populated to the ajax url 'form' - it will be pushed automatically and displayed in the inputs there - keep the names consistent to work correctly)
        var $this = $(this);
        var $data = {};
        $.extend($data, $this.data());

        var title = $data.title || "Info";
        delete $data.title;

        var size = $data.size || $data.sz || "md";
        delete $data.size;
        delete $data.sz;

        var ajax = $data.ajax || null;
        delete $data.ajax;

        var body = $data.message || null;
        delete $data.body;

        var cb = $data.callback || $data.cb || undefined;
        delete $data.callback;
        delete $data.cb;

        var hcb = $data.hiddenCallback || $data.hCb || undefined;
        delete $data.hiddenCallback;
        delete $data.hCb;



        if (!ajax && !body)
            body = "Please specify either ajax url [data-ajax] or message [data-message] to be displayed in this window";

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

    });

    return exports;

})();