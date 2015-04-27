$(function() {
    // Returns defaultVal if arg is undefined - useful for 
    // providing default function parameter values
    argDefault = function(arg, defaultVal) {
        return (typeof(arg) === 'undefined') ? defaultVal : arg;
    }

    var queueCalc = _.debounce(function() {
        console.log('gi')
        calc();
        render();
    }, 500);
    settings = {};

    // Return the months between the start and end dates
    // (e.g. ['1/2001', '12/2002'] -> [new Date('1/1/2001'), new Date('2/1/2001'), ...]
    months = function(dateRange) {
        if (!Array.isArray(dateRange)) { return []; }
        start = moment(dateRange[0], ['MM/YYYY', 'MM/YY']);
        end = moment(dateRange[1], ['MM/YYYY', 'MM/YY']);

        var current = moment(start),
            months = [];
        while (current <= end) {
            months.push(new Date(current));
            current.add(1, 'M');
        }
        return months;
    }

    var MONTHS_TEXT_FORMAT = 'MMM YYYY';
    monthsText = function(monthsList) {
        if (!Array.isArray(monthsList)) {
            return moment(monthsList).format(MONTHS_TEXT_FORMAT);
        }
        return _.map(monthsList, function(m) { return moment(m).format(MONTHS_TEXT_FORMAT); });
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
                if (Array.isArray(rng)) {
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

    drawBarGraph = function(elId, x, y, options) {
        x = argDefault(x, []);
        y = argDefault(y, []);
        options = argDefault(options, {});

        var dd = [];
        for (var i = 0; i < x.length; i++) {
            dd.push([x[i], y[i]]);
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
                xaxis: options.xaxis || {},
                yaxis: options.yaxis || {},
                mouse: options.mouse || {
                    position: 'ne',
                    track: true,
                    trackDecimals: 0,
                    sensibility: 30,
                    trackY: true,
                },
            }
        );
    }

    drawLineGraph = function(elId, x, y, options) {
        x = argDefault(x, []);
        y = argDefault(y, []);
        options = argDefault(options, {});

        var dd = [];
        for (var i = 0; i < x.length; i++) {
            dd.push([x[i], y[i]]);
        }
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
                colors: options.colors || ['#00A8F0', '#C0D800', '#9440ED'],
                xaxis: options.xaxis || {},
                yaxis: options.yaxis || {},
                mouse: options.mouse || {
                    position: 'ne',
                    track: true,
                    trackDecimals: 0,
                    sensibility: 30,
                    trackY: true,
                },
            }
        );
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
    });
}
