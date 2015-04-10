$(function() {
    var date_ranges = [
        [moment('1/1/2007'), moment('6/30/2011')],
        [moment('7/1/2011'), moment('6/30/2012')],
        [moment('7/1/2012'), moment('6/30/2013')],
        [moment('7/1/2013'), moment('6/30/2014')],
        [moment('7/1/2014'), moment('12/31/2015')],
    ];

    function init() {
        // Format datetime fields
        for (var i in data) {
            data[i]['Admit'] = moment(data[i]['Admit']);
        }
    }

    function losForDates(data, dates) {
        var los = [];
        for (var i in data) {
            if (data[i]['Admit'].isBetween(dates[0], dates[1])) {
                los.push(data[i]['LOS']);
            }
        }
        return los;
    }

    function refresh(data) {
        // LOS breakdown
        var los = [];
        for (var i in date_ranges) {
            los.push(losForDates(data, date_ranges[i]))
        }
        var medians = los.map(function(arr) { return ss.median(arr); }),
            mads = los.map(function(arr) { return ss.mad(arr); }),
            means = los.map(function(arr) { return ss.mean(arr); }),
            stddevs = los.map(function(arr) { return ss.standard_deviation(arr); });

        // LOS graph
        var i,
            dd1 = [],
            graph = $('#graph1')[0],
            date_format = 'MMM YYYY';

        for (i = 0; i < means.length; i++) {
            dd1.push([i, means[i] * 24]);
        }
        Flotr.draw(graph, [
                { 
                    data: dd1,
                    lines: { show: true },
                    points: { show: true },
                    markers: {
                        show: true,
                        position: 'rt',
                        labelFormatter: function(o) { return o.y.toFixed(2); },
                    },
                }
            ], {
                colors: ['#00A8F0', '#C0D800', '#9440ED'],
                // bars : { show : true, },
                xaxis: {
                    min: -0.2,
                    max: 4.2,
                    tickFormatter: function (x) {
                        var i = parseInt(x);
                        if (i < 0 || i >= date_ranges.length) { return ''; }
                        return date_ranges[i][0].format(date_format) + ' to ' + date_ranges[i][1].format(date_format);
                    }
                },
                yaxis: {
                    title: 'Average LOS<br/>(hours)',
                    min: 25,
                    max: 35,
                },
                mouse: {
                    position: 'ne',
                    track: true,
                    trackDecimals: 2,
                    sensibility: 30,
                    trackY: true,
                    trackFormatter: function(e) { return 'Mean = '+e.y; }
                },
                legend : {
                    position : 'se',
                }
            }
        );

        // Statistics
        var ntable = $('#ntable');

        console.log(stddevs)
    }

    init();
    refresh(data);
});