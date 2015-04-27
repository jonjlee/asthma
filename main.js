$(function() {
    init = function() {
        // Format datetime fields
        for (var i in data) {
            data[i]['Admit'] = new Date(data[i]['Admit']);
        }

        var allMonths = months(['1/2007', '12/2015']),
            comparatorMonths = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
            comparatorMonthsText = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

        makeSliderRangeParam('#baseline-range', 'baselineRange', allMonths, { text: monthsText(allMonths), defaultVal: [allMonths[0], allMonths[50]] });
        makeSliderRangeParam('#comparator-range', 'comparatorMonths', comparatorMonths, { text: comparatorMonthsText, defaultVal: [10, 3] });
        makeSliderParam('#readmission-days', 'numDaysForReadmission', _.range(1,31), { defaultVal: 3 });
    };

    calc = function() {
        // numDaysForReadmission = 1 - 30
        // Note, this modifies data[].readmit
        calcReadmissions(data, settings.numDaysForReadmission);

        // baselineRange = [Date, Date]
        baselineData = filterByMonths(data, settings.baselineRange);
        baselineRangeText = monthsText(settings.baselineRange);

        // comparatorMonths = [int, int]
        // comparatorRanges = [[comparatorMonths[0]/2007, comparatorMonths[1]/2008], ...]
        comparatorRanges = _.map(_.range(2007, 2015), function(year) { 
            return [
                moment(year + '-' + settings.comparatorMonths[0], 'YYYY-MM').toDate(),
                moment(year+1 + '-' + settings.comparatorMonths[1], 'YYYY-MM').toDate(),
            ];
        });
        // comparatorRangeText = ['Oct 2007 - Mar 2008', ...]
        comparatorRangeText = _.map(comparatorRanges, function(r) {
            return monthsText(r).join(' - ');
        });
        // comparatorRangeText = [dataset1, dataset2, ...]
        comparatorData = _.map(comparatorRanges, function(r) {
            return filterByMonths(data, r);
        });

        // Length of stay for each date range
        baselineLos = _.pluck(baselineData, 'LOS'),
        comparatorLos = _.map(comparatorData, function(d) {
            return _.pluck(d, 'LOS'); 
        });

        // LOS stats
        nsamples = _.map(comparatorLos, function(arr) { return arr.length; }), 
        medians = _.map(comparatorLos, function(arr) { return ss.median(arr).toFixed(2); }),
        mads = _.map(comparatorLos, function(arr) { return ss.mad(arr).toFixed(2); }),
        means = _.map(comparatorLos, function(arr) { return ss.mean(arr).toFixed(2); }),
        stddevs = _.map(comparatorLos, function(arr) { return ss.standard_deviation(arr).toFixed(2); });

        // Number of readmissions per date range.
        // readmits = [dataset, ...]
        readmits = _.map(comparatorData, function(d) {
            return _.filter(d, function(row) { return row.readmit; });
        });
        numReadmits = _.map(readmits, function(d) { return d.length; });
        console.log(readmits)
    };

    render = function() {
        // LOS graph
        drawLineGraph('#graph1', _.range(0, means.length), means, {
            xaxis: {
                min: -0.2,
                max: means.length - 0.8,
                tickFormatter: function (x) {
                    return comparatorRangeText[parseInt(x)] || '';
                }
            },
            yaxis: {
                title: 'Average LOS<br/>(hours)',
                autoscale: true,
                autoscaleMargin: 0.2,
            },
        });

        // // Length of stay histograms
        // var dd = [],
        //     dx = 3,
        //     trackFormatter = function(e) { 
        //         var x = parseInt(e.x), y = parseInt(e.y);
        //         return y + ' pts, ' + x + '-' + parseFloat(e.series.data[e.index+1][0]).toFixed(0) + ' hours'; 
        //     };
        // for (i = 0; i < comparatorLos.length; i++) {
        //     var days = _.map(comparatorLos[i], function(v) { return v; }),
        //         bins = histogram().range([0,30]).bins(30)(days),
        //         dx = bins[0].dx;
        //     dd.push({
        //         data: _.map(bins, function(v) { return [v.x, v.y]; }),
        //         bars: { show: true, barWidth: dx, centered: false }
        //     });
        // }
        // // Remove all points with n=0
        // for (i = 0; i<dd.length; i++) {
        //     for (j=dd[i].data.length-1; j >= 0; j--) {
        //         if (dd[i].data[j][1] <= 0) {
        //             dd[i].data.splice(j, 1);
        //         }
        //     }
        // }
        // // Add graphs
        // var $histograms = $('#histograms'),
        //     tpl = _.template($('#loshistogram-2-col-template').html());
        // for (i = 0; i < 5; i+=2) {
        //     var cols =  [
        //         { graphId: 'loshistogram' + i, timeRange: comparatorRangeText[i] },
        //         { graphId: 'loshistogram' + (i+1), timeRange: comparatorRangeText[i+1] },
        //     ];
        //     if (i+2 > 5) { cols.splice(1); }
        //     $histograms.append(tpl({ data: cols }));
        // }
        // // Draw graphs
        // for (i = 0; i < 5; i++) {
        //     graph = $('#loshistogram'+i)[0];
        //     Flotr.draw(graph, [dd[i]], {
        //         xaxis: { title: '', min: 0, max: 30},
        //         yaxis: { title: 'n' },
        //         mouse: {
        //             position: 'ne',
        //             track: true,
        //             trackDecimals: 2,
        //             trackFormatter: trackFormatter
        //         },
        //     });
        // }

        // Readmits graph
        drawBarGraph('#readmits-graph', _.range(0, numReadmits.length), numReadmits, {
            xaxis: {
                autoscale: true,
                autoscaleMargin: 0.2,
                tickFormatter: function (x) {
                    return comparatorRangeText[parseInt(x)] || '';
                }
            },
            yaxis: {
                title: '#',
                autoscale: true,
                autoscaleMargin: 0.5,
            },
            mouse: {
                position: 'ne',
                track: true,
                trackDecimals: 0,
                trackFormatter: function(e) { return e.y + ' readmissions'; }
            },
        });

        // Statistics
        drawTable('#stats-table', [
            [''].concat(comparatorRangeText),
            ['# Samples'].concat(nsamples),
            ['Average (hrs)'].concat(means),
            ['Stddev (hrs)'].concat(stddevs),
            ['Median (hrs)'].concat(medians),
            ['MAD (hrs)'].concat(mads)],
            1, 1);
    };

    filterByMonths = function(data, monthsRange) {
        var filtered = [],
            min = moment(monthsRange[0]).toDate(),
            max = moment(monthsRange[1]).add(1, 'month').toDate();
        return _.filter(data, function(row) { 
            var date = row['Admit'];
            return (date >= min && date < max);
        });
    }
    losForDates = function(data, dates) {
        var los = [];
        for (var i in data) {
            var date = data[i]['Admit'];
            if (date >= dates[0] && date <= dates[1]) {
                los.push(data[i]['LOS']);
            }
        }
        return los;
    }

    readmitsForDates = function(data, dates) {
        var readmits = 0;
        for (var i in data) {
            var date = data[i]['Admit'];
            if (date >= dates[0] && date <= dates[1] && data[i].readmit) {
                readmits += 1;
            }
        }
        return readmits;
    }

    calcReadmissions = function(data, dayIntervalForReadmit) {
        var lastVisitById = {};
        _.each(data, function(row) {
            var visit = row['Admit'],
                readmitLimit = new Date(visit),
                lastVisit = lastVisitById[row.pid];
            readmitLimit.setDate(readmitLimit.getDate() - dayIntervalForReadmit);
            if (lastVisit && (lastVisit >= readmitLimit)) {
                row.readmit = 1;
            } else {
                row.readmit = 0;
            }
            lastVisitById[row.pid] = visit;
        });
    }
});