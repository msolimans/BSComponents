window.bscom = window.bscom || {};

(function () {

    var $template =
        $("<div class='card'> \
        <div class='card-header'> \
        </div> \
        <table class='table'> \
            <thead> \
            </thead> \
            <tbody> \
            </tbody> \
        </table> \
        </div> \
        </div>");


var $filter =  $('<button class="btn btn-default btn-sm"><i class="fa fa-filter"></i> Filter</button>').click(function(){
     alert("test");
    });



    (function ($) {
        $.fn.bsGrid = function (options) {
            var settings = $.extend({
                //Defaults
                style: "primary",
                name: "Grid",
                filter: true,
                autoPopulate: true,
                cols:[],
                data: [],
                merge: true
            }, options);

            var $header = $template.find("div.card-header"),
                $thead = $template.find("thead"),
                $tbody = $template.find("tbody");

            $template.addClass("card-outline-" + settings.style);
            $header.addClass("card-" + settings.style).append("<span style='color: white'>" + settings.name + "</span>");

            //add filter
            if (settings.filter) {
                $header.append($("<div class=\"float-right\"></div>").append($filter));
            }

            if(settings.cols.length == 0) {
                //build it
                for(var indx in settings.data){
                    for(var p in settings.data[indx]) {
                        if (settings.cols.indexOf(p) > -1)
                            continue;
                        settings.cols.push(p);
                    }
                }
            }

            var trh = $("<tr class='filters'></tr>");
            settings.cols.forEach(function (t) {
                //populate header
                trh.append("<th><input type='text' class='form-control' placeholder='#' disabled /></th>");
            });
            trh.appendTo($thead);


            settings.data.forEach(function (t) {

                //populate content (rows) based on defined cols
                    var tr = "<tr>";

                    for (var col in settings.cols) {
                        tr += "<td>" + t[settings.cols[col]] + "</td>";
                    }

                    tr += "</tr>";

                $tbody.append(tr);


            });




            this.filter("div").append(function () {
                return $template;
            });

            return this;
        }

    })(jQuery);

})();