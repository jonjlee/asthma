$(function() {
    function dateRangeText(dates) {
        if (!dates) { return null; }
        var date_format = 'MMM YYYY';
        return moment(dates[0]).format(date_format) + ' to ' + moment(dates[1]).format(date_format);
    }
    var DATE_RANGES = [
            [new Date('1/1/2007'), new Date('3/31/2011')],
            [new Date('10/1/2011'), new Date('3/31/2012')],
            [new Date('10/1/2012'), new Date('3/31/2013')],
            [new Date('10/1/2013'), new Date('3/31/2014')],
            [new Date('10/1/2014'), new Date('3/31/2015')],
            // [new Date('1/1/2007'), new Date('6/30/2011')],
            // [new Date('7/1/2011'), new Date('6/30/2012')],
            // [new Date('7/1/2012'), new Date('6/30/2013')],
            // [new Date('7/1/2013'), new Date('6/30/2014')],
            // [new Date('7/1/2014'), new Date('12/31/2015')],
        ],
        DATE_RANGES_TEXT = DATE_RANGES.map(dateRangeText);

    function init() {
        // Format datetime fields
        for (var i in data) {
            data[i]['Admit'] = new Date(data[i]['Admit']);
        }

    }

    function losForDates(data, dates) {
        var los = [];
        for (var i in data) {
            var date = data[i]['Admit'];
            if (date >= dates[0] && date <= dates[1]) {
                los.push(data[i]['LOS']);
            }
        }
        return los;
    }

    function refresh(data) {
        // LOS breakdown
        var los = [];
        for (var i in DATE_RANGES) {
            los.push(losForDates(data, DATE_RANGES[i]));
        }
        var nsamples = los.map(function(arr) { return arr.length; }), 
            medians = los.map(function(arr) { return ss.median(arr).toFixed(2); }),
            mads = los.map(function(arr) { return ss.mad(arr).toFixed(2); }),
            means = los.map(function(arr) { return ss.mean(arr).toFixed(2); }),
            stddevs = los.map(function(arr) { return ss.standard_deviation(arr).toFixed(2); });

        // LOS graph
        var i, j,
            dd1 = [],
            graph = $('#graph1')[0];
        for (i = 0; i < means.length; i++) {
            dd1.push([i, means[i]]);
        }
        Flotr.draw(graph, [
                { 
                    data: dd1,
                    lines: { show: true },
                    points: { show: true },
                    markers: {
                        show: true,
                        position: 'rt',
                        labelFormatter: function(o) { return o.y; },
                    },
                }
            ], {
                colors: ['#00A8F0', '#C0D800', '#9440ED'],
                xaxis: {
                    min: -0.2,
                    max: 4.2,
                    tickFormatter: function (x) {
                        return DATE_RANGES_TEXT[parseInt(x)] || '';
                    }
                },
                yaxis: {
                    title: 'Average LOS<br/>(hours)',
                    autoscale: true,
                    autoscaleMargin: 0.2,
                },
                mouse: {
                    position: 'ne',
                    track: true,
                    trackDecimals: 2,
                    sensibility: 30,
                    trackY: true,
                    trackFormatter: function(e) { return 'Mean = '+e.y; }
                },
            }
        );

        // Length of stay histograms
        var dd = [],
            dx = 3,
            trackFormatter = function(e) { 
                var x = parseInt(e.x), y = parseInt(e.y);
                return y + ' pts, ' + x + '-' + parseFloat(e.series.data[e.index+1][0]).toFixed(0) + ' hours'; 
            };
        for (i = 0; i < los.length; i++) {
            var days = los[i].map(function(v) { return v; }),
                bins = histogram().range([0,30]).bins(30)(days),
                dx = bins[0].dx;
            dd.push({
                data: bins.map(function(v) { return [v.x, v.y]; }),
                bars: { show: true, barWidth: dx, centered: false }
            });
        }
        // Remove all points with n=0
        for (i = 0; i<dd.length; i++) {
            for (j=dd[i].data.length-1; j >= 0; j--) {
                if (dd[i].data[j][1] <= 0) {
                    dd[i].data.splice(j, 1);
                }
            }
        }
        // Add graphs
        var $histograms = $('#histograms'),
            tpl = _.template($('#loshistogram-2-col-template').html());
        for (i = 0; i < 5; i+=2) {
            var cols =  [
                { graphId: 'loshistogram' + i, timeRange: DATE_RANGES_TEXT[i] },
                { graphId: 'loshistogram' + (i+1), timeRange: DATE_RANGES_TEXT[i+1] },
            ];
            if (i+2 > 5) { cols.splice(1); }
            $histograms.append(tpl({ data: cols }));
        }
        // Draw graphs
        for (i = 0; i < 5; i++) {
            graph = $('#loshistogram'+i)[0];
            Flotr.draw(graph, [dd[i]], {
                xaxis: { title: '', min: 0, max: 30},
                yaxis: { title: 'n' },
                mouse: {
                    position: 'ne',
                    track: true,
                    trackDecimals: 2,
                    trackFormatter: trackFormatter
                },
            });
        }

        // Statistics
        var $statstable = $('#stats-table'),
            statstabletpl = _.template($('#table-template').html());
        $statstable.append(statstabletpl({
            num_header_rows: 1,
            num_header_cols: 1,
            rows: [
                [''].concat(DATE_RANGES_TEXT),
                ['# Samples'].concat(nsamples),
                ['Average (hrs)'].concat(means),
                ['Stddev (hrs)'].concat(stddevs),
                ['Median (hrs)'].concat(medians),
                ['MAD (hrs)'].concat(mads),
            ]
        }));
    }

    init();
    refresh(data);
});