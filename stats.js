$(function() {
    var date_ranges = [
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
    ];

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
        for (var i in date_ranges) {
            los.push(losForDates(data, date_ranges[i]));
        }
        var nsamples = los.map(function(arr) { return arr.length; }), 
            medians = los.map(function(arr) { return ss.median(arr).toFixed(2); }),
            mads = los.map(function(arr) { return ss.mad(arr).toFixed(2); }),
            means = los.map(function(arr) { return ss.mean(arr).toFixed(2); }),
            stddevs = los.map(function(arr) { return ss.standard_deviation(arr).toFixed(2); });

        // LOS graph
        var i, j,
            dd1 = [],
            graph = $('#graph1')[0],
            date_format = 'MMM YYYY';
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
                        var i = parseInt(x);
                        if (i < 0 || i >= date_ranges.length) { return ''; }
                        return moment(date_ranges[i][0]).format(date_format) + ' to ' + moment(date_ranges[i][1]).format(date_format);
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
                console.log(e)
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
        console.log(dd)
        // Draw graphs
        for (i = 0; i < 5; i++) {
            graph = $('#graph' + (i+2))[0];
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
        var $statstablebody = $('#stats-table > tbody'),
            tpl = _.template($('#statsrow-template').html());
        $statstablebody
            .append(tpl({ label: '# Samples', cols: nsamples }))
            .append(tpl({ label: 'Average (hrs)', cols: means }))
            .append(tpl({ label: 'Stddev (hrs)', cols: stddevs }))
            .append(tpl({ label: 'Median (hrs)', cols: medians }))
            .append(tpl({ label: 'MAD (hrs)', cols: mads }));
    }

    init();
    refresh(data);
});