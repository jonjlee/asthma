$(function() {
    // Global settings object, which should be modified by controls in sidebar
    // and used by calc()
    settings = {};

    // Returns defaultVal if arg is undefined - useful for 
    // providing default function parameter values
    argDefault = function(arg, defaultVal) {
        return (typeof arg === 'undefined' || arg === null) ? defaultVal : arg;
    }

    // Schedule calc() and render() after 500ms of no activity in sidebar
    queueCalc = _.debounce(function() {
        calc();
        render();
    }, 500);

    // Return the months between the start and end dates
    // (e.g. ['1/2001', '12/2002'] -> [new Date('1/1/2001'), new Date('2/1/2001'), ...]
    months = function(dateRange) {
        if (!_.isArray(dateRange)) { return []; }
        start = moment(dateRange[0], ['MM/YYYY', 'MM/YY']);
        end = moment(dateRange[1], ['MM/YYYY', 'MM/YY']);

        var current = moment(start),
            months = [];
        while (current <= end) {
            months.push(new Date(current));
            current.add(1, 'month');
        }
        return months;
    }

    var MONTHS_TEXT_FORMAT = 'MMM YY';
    monthsText = function(monthsList) {
        if (!_.isArray(monthsList)) {
            return moment(monthsList).format(MONTHS_TEXT_FORMAT);
        }
        return _.map(monthsList, function(m) { return moment(m).format(MONTHS_TEXT_FORMAT); });
    }

    bindParam = function(elId, varName) {
        var $el = $(elId);
        settings[varName] = $(elId).val();
        $el.change(function() {
            settings[varName] = $el.val();
            queueCalc();
        });
    }

    // Create a slider widget to choose a value from a list. 
    // For example, makeRangeParam('#param1', _.range(1,100)) makes 
    // a slider to select a single number between 1 and 100.
    // options = { text: [], defaultVal: v }
    makeSliderParam = function(elId, varName, vals, options) {
        options = argDefault(options, {});
        var text = argDefault(options.text, vals),
            defaultVal = argDefault(options.defaultVal, vals[0]);
        settings[varName] = defaultVal;

        var $slider = $(elId).slider({
            min: 0,
            max: vals.length-1,
            value: vals.indexOf(defaultVal),
            focus: true,
            tooltip: 'always',
            formatter: function(v) { return text[v]; }
        });

        $slider.on('slide', function(e) {
            if (typeof(e) === 'undefined' || typeof(e.value) === 'undefined') { return; }
            settings[varName] = e.value;
            queueCalc();
        });

        return $slider;
    }

    // Create a slider widget to set a range from the array vals. 
    // For example, makeRangeParam('#param1', _.range(1,100)) makes 
    // a slider to select a section between 1 and 100.
    // options = { text: [], defaultVal: [x, y] }
    makeSliderRangeParam = function(elId, varName, vals, options) {
        options = argDefault(options, {});
        var text = argDefault(options.text, vals),
            defaultVal = argDefault(options.defaultVal, [vals[0], vals[vals.length-1]]);
        settings[varName] = defaultVal;

        var $slider = $(elId).slider({
            min: 0,
            max: vals.length-1,
            value: [vals.indexOf(defaultVal[0]), vals.indexOf(defaultVal[1])],
            range: true,
            focus: true,
            tooltip: 'always',
            formatter: function(rng) {
                if (_.isArray(rng)) {
                    return text[rng[0]] + ' - ' + text[rng[1]];
                }
            }
        });

        $slider.on('slide', function(e) {
            if (typeof(e) === 'undefined' || typeof(e.value) === 'undefined') { return; }
            settings[varName] = _.map(e.value, function(i) { return vals[i]; });
            queueCalc();
        });

        return $slider;
    }

    drawBarGraph = function(elId, options) {
        options = argDefault(options, {});

        // Data to plot
        var y = argDefault(options.y, []),
            x = argDefault(options.x, _.range(0, y.length)),
            dd = _.map(x, function(xval, idx) { return [xval, y[idx]]; });

        // Graph configuration options
        var colors = argDefault(options.colors, ['#00A8F0', '#C0D800', '#9440ED']),
            xaxis = argDefault(options.xaxis, Flotr.defaultOptions.xaxis),
            yaxis = argDefault(options.yaxis, Flotr.defaultOptions.yaxis),
            grid = argDefault(options.grid, { verticalLines: false }),
            trackFormatter = argDefault(options.trackFormatter, Flotr.defaultTrackFormatter),
            mouse = argDefault(options.mouse, {
                position: 'ne',
                track: true,
                trackFormatter: trackFormatter });

        // Provide x-axis labels to Flotr if specified
        if (!options.xaxis && options.xlabels) {
            xaxis = {
                min: -0.7,
                max: _.max(x) + 0.7,
                tickFormatter: function (x) { return options.xlabels[parseInt(x)] || ''; }
            }
        }
        Flotr.draw($(elId)[0], [
                { 
                    data: dd,
                    bars: { show: true },
                    points: { show: false },
                    markers: {
                        show: true,
                        position: 'rt',
                        labelFormatter: function(o) { return o.y; },
                    },
                }
            ], {
                colors: options.colors || ['#00A8F0', '#C0D800', '#9440ED'],
                xaxis: xaxis,
                yaxis: yaxis,
                grid: grid,
                mouse: mouse,
            }
        );
    }

    // Draw a line graph using the data in options.x and options.y.
    // Only options.y is required. 
    // options = {
    //      x: [1, 2, ...],                                     // Default is 0 to y.length.
    //      y: [10, 11, ...],                                   
    //      xlabels: ['Monday', 'Tuesday', ...],                // Ignored if xaxis is specified.
    //      trackFormatter: { Flotr mouse.trackFormatter() },   // Ignored if mouse is specified.
    //      mouse: { Flotr mouse },
    //      colors: ['#00A8F0', ...],
    // }
    drawLineGraph = function(elId, options) {
        options = argDefault(options, {});

        // Data to plot
        var y = argDefault(options.y, []),
            x = argDefault(options.x, _.range(0, y.length));

        // Graph configuration options
        var colors = argDefault(options.colors, ['#00A8F0', '#C0D800', '#9440ED']),
            xaxis = argDefault(options.xaxis, Flotr.defaultOptions.xaxis),
            yaxis = argDefault(options.yaxis, Flotr.defaultOptions.yaxis),
            trackFormatter = argDefault(options.trackFormatter, Flotr.defaultTrackFormatter),
            mouse = argDefault(options.mouse, {
                position: 'ne',
                track: true,
                sensibility: 30,
                trackFormatter: trackFormatter });

        // Provide x-axis labels to Flotr if specified
        if (!options.xaxis && options.xlabels) {
            xaxis = {
                min: -0.2,
                max: _.max(x) + 0.2,
                tickFormatter: function (x) { return options.xlabels[parseInt(x)] || ''; }
            }
        }

        var dd = _.map(x, function(xval, idx) { return [xval, y[idx]]; })
        Flotr.draw($(elId)[0], [
                { 
                    data: dd,
                    points: { show: true },
                    lines: { show: true },
                    markers: {
                        show: true,
                        position: 'rt',
                        labelFormatter: function(o) { return o.y; },
                    },
                }
            ], {
                colors: colors,
                xaxis: xaxis,
                yaxis: yaxis,
                mouse: mouse,
            }
        );
    }

    // Draw a line graph using the data in options.y with the x-axis specified
    // by options.x0 and options.dx.
    // options = {
    //      x0: 0,                                              // start of first bin
    //      dx: 5,                                              // size of bins
    //      y: [10, 11, ...],                                   // values of bins
    //      xlabels: ['Monday', 'Tuesday', ...],                // Override default x labels generated from x0 and dx
    //      trackFormatter: { Flotr mouse.trackFormatter() },   // Ignored if mouse is specified.
    //      mouse: { Flotr mouse },
    //      colors: ['#00A8F0', ...],
    // }
    drawHistogram = function(elId, options) {
        options = argDefault(options, {});

        // Data to plot
        var y = argDefault(options.y, []),
            x = argDefault(options.x, _.range(0, y.length)),
            dd = _.map(x, function(xval, idx) { return [xval, y[idx]]; });

        // Create x-axis labels for histogram based on x_0 and dx (i.e. bin size)
        var xaxis = argDefault(options.xaxis, Flotr.defaultOptions.xaxis),
            x0 = argDefault(options.x0, 0),
            dx = argDefault(options.dx, 1);
        xaxis.min = argDefault(xaxis.min, -0.7);
        xaxis.max = argDefault(xaxis.max, _.max(x)+0.7);
        if (options.xlabels) {
            xaxis.tickFormatter = function(x) { return options.xlabels[parseInt(x)] || ''; };
        } else {
            xaxis.tickFormatter = function(x) { return (parseInt(x)*dx + x0) + ' - ' + ((parseInt(x)+1)*dx + x0 - 1)};
        }

        // Mouse tracker
        var trackFormatter = function(v) { return '[' + xaxis.tickFormatter(v.x) + ']: ' + parseInt(v.y); }
        
        return drawBarGraph(elId, { x: x, y: y, xaxis: xaxis, trackFormatter: trackFormatter });
    }

    var tableTpl = _.template(
      '<tbody><% _.each(rows, function(row, rownum) { %>' +
      '  <tr><% _.each(row, function(col, colnum) {' +
      '    header = (rownum < num_header_rows || colnum < num_header_cols);' +
      '    if (header) {' +
      '      print("<th>" + col + "</th>");' +
      '    } else {' +
      '      print("<td>" + col + "</td>");' +
      '    }' +
      '  }); %></tr>' +
      '<% }); %></tbody>');
    drawTable = function(elId, rows, num_header_rows, num_header_cols) {
        $(elId).html(tableTpl({
            num_header_rows: argDefault(num_header_rows, 0),
            num_header_cols: argDefault(num_header_cols, 0),
            rows: rows
        }));
    }
});

_init = function() {
    $(function() {
        init();
        calc();
        render();
        $(window).resize(queueCalc);
    });
}
