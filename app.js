$(function() {
    init = function() {
        // Format datetime fields
        for (var i in data) {
            data[i]['Admit'] = new Date(data[i]['Admit']);
        }

        bindParam('#visit-type', 'visitType');
        bindParam('#gender', 'gender');

        var allMonths = months(['1/2007', '12/2015']),
            comparatorMonths = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
            comparatorMonthsText = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

        makeSliderRangeParam('#baseline-range', 'baselineRange', allMonths, { text: monthsText(allMonths), defaultVal: [allMonths[0], allMonths[50]] });
        makeSliderRangeParam('#comparator-range', 'comparatorMonths', comparatorMonths, { text: comparatorMonthsText, defaultVal: [7, 12] });
        makeSliderRangeParam('#readmission-days', 'numDaysForReadmission', _.range(0,31), { defaultVal: [0,30] });
    };

    calc = function() {
        // numDaysForReadmission = 1 - 30
        // Note, this modifies data[].readmit
        calcReadmissions(data, settings.numDaysForReadmission);

        // Filter by visit type
        filtered = data
        if (settings.visitType === 'ER only') {
            filtered = _.filter(data, function(row) { return row.type === 'ER'; });
        }

        // Filter by gender
        if (settings.gender !== 'All') {
            filtered = _.filter(data, function(row) { return row.Sex === settings.gender; });
        }

        // baselineRange = [Date, Date]
        baselineData = filterByMonths(filtered, settings.baselineRange);
        baselineRangeText = monthsText(settings.baselineRange);

        // comparatorMonths = [int, int]
        // comparatorRanges = [[comparatorMonths[0]/2007, comparatorMonths[1]/2008], ...]
        comparatorRanges = _.map(_.range(2007, 2015), function(year) { 
            var endYear = (settings.comparatorMonths[1] >= 6) ? year : year+1;
            return [
                moment(year + '-' + settings.comparatorMonths[0], 'YYYY-MM').toDate(),
                moment(endYear + '-' + settings.comparatorMonths[1], 'YYYY-MM').toDate(),
            ];
        });
        // // Generate monthly data
        // comparatorRanges = [];
        // for (var i = 2007; i <= 2015; i++) {
        //     for (var j = 1; j <= 12; j++) {
        //         if (j<10) {
        //             comparatorRanges.push([new Date(i + '-0' + j), new Date(i + '-0' + j)]);
        //         } else {
        //             comparatorRanges.push([new Date(i + '-' + j), new Date(i + '-' + j)]);
        //         }
        //     }
        // }
        // comparatorRangeText = ['Oct 2007 - Mar 2008', ...]
        comparatorRangeText = _.map(comparatorRanges, function(r) {
            return (r[0] - r[1]) ? monthsText(r).join(' - ') : monthsText(r[0]);
        });
        // comparatorData = [dataset1, dataset2, ...]
        comparatorData = _.map(comparatorRanges, function(r) {
            return filterByMonths(filtered, r);
        });

        // Length of stay for each date range
        baselineLos = _.pluck(baselineData, 'los'),
        comparatorLos = _.map(comparatorData, function(d) {
            return _.pluck(d, 'los'); 
        });

        // LOS stats
        nsamples = _.map(comparatorLos, function(arr) { return arr.length; }), 
        medians = _.map(comparatorLos, function(arr) { return (ss.median(arr) || 0).toFixed(2); }),
        mads = _.map(comparatorLos, function(arr) { return (ss.mad(arr) || 0).toFixed(2); }),
        means = _.map(comparatorLos, function(arr) { return (ss.mean(arr) || 0).toFixed(2); }),
        stddevs = _.map(comparatorLos, function(arr) { return (ss.standard_deviation(arr) || 0).toFixed(2); });

        // Number of admissions per date range
        numAdmits = _.map(comparatorData, function(d) {
            return _.filter(d, function(row) { return row.type === 'IN'; }).length;
        });
        percentAdmits = _.map(comparatorData, function(d, idx) {
            return d.length ? (numAdmits[idx] / d.length).toFixed(2) : 0;
        });

        // Number of readmissions per date range.
        // readmits = [dataset, ...]
        readmits = _.map(comparatorData, function(d) {
            return _.filter(d, function(row) { return row.readmit; });
        });
        visitsCausingReadmit = _.map(comparatorData, function(d) {
            return _.filter(d, function(row) { return row.causedReadmit; });
        });
        numVisitsCausingReadmit = _.map(visitsCausingReadmit, function(d) { 
            return d.length; 
        });
        percentVisitsCausingReadmit = _.map(visitsCausingReadmit, function(d, idx) { 
            var p = d.length / comparatorData[idx].length * 100;
            return parseFloat(p.toFixed(1));
        });

        // Nebs & steroids for each date range
        comparatorNebsTime = _.map(comparatorData, function(d) {
            return _(d)
                .pluck('nebDelay')
                .filter(function(t) { return t != null; })
                .map(function(t) { return parseFloat(t); })
                .value(); 
        });
        comparatorSteroidsTime = _.map(comparatorData, function(d) {
            return _(d)
                .pluck('steroidDelay')
                .filter(function(t) { return t != null; })
                .map(function(t) { return parseFloat(t); })
                .value(); 
        });
        nNebs = _.map(comparatorNebsTime, function(arr) { return arr.length; });
        nSteroids = _.map(comparatorSteroidsTime, function(arr) { return arr.length; });
        nebsMeans = _.map(comparatorNebsTime, function(arr) { return (ss.average(arr) || 0).toFixed(0); })
        steroidsMeans = _.map(comparatorSteroidsTime, function(arr) { return (ss.average(arr) || 0).toFixed(0); })
    };

    render = function() {
        // LOS graph
        drawLineGraph('#graph1', {
            xlabels: comparatorRangeText,
            y: means,
            ytitle: 'Average LOS<br/>(hours)',
            yunits: 'hrs',
        });

        // Admits / readmits graph
        drawBarGraph('#admits-graph', {
            xlabels: comparatorRangeText,
            y: percentAdmits,
            ytitle: '% of visits',
            trackFormatter: function(e) { 
                var x = parseInt(e.x);
                return '[' + comparatorRangeText[x] + ']: ' + numAdmits[x] + '/' + nsamples[x] + ' visits (' + e.y + '%)'; 
            }
        });
        drawBarGraph('#readmits-graph', {
            xlabels: comparatorRangeText,
            y: percentVisitsCausingReadmit,
            ytitle: '% of visits',
            trackFormatter: function(e) { 
                var x = parseInt(e.x);
                return '[' + comparatorRangeText[x] + ']: ' + numVisitsCausingReadmit[x] + '/' + nsamples[x] + ' visits (' + e.y + '%)'; 
            }
        });

        // Nebs and steroids graphs
        drawLineGraph('#nebs-graph', {
            xlabels: comparatorRangeText,
            y: nebsMeans,
            ytitle: 'Minutes',
            yunits: 'min',
        });
        // LOS graph
        drawLineGraph('#steroids-graph', {
            xlabels: comparatorRangeText,
            y: steroidsMeans,
            ytitle: 'Minutes',
            yunits: 'min',
        });

        // Statistics
        drawTable('#n-table', [
            [''].concat(comparatorRangeText),
            ['# Visits'].concat(nsamples),
            ], 1, 1);
        drawTable('#stats-table', [
            [''].concat(comparatorRangeText),
            ['Average (hrs)'].concat(means),
            ['Stddev (hrs)'].concat(stddevs),
            ['Median (hrs)'].concat(medians),
            ['MAD (hrs)'].concat(mads),
            ], 1, 1);
        drawTable('#readmit-table', [
            [''].concat(comparatorRangeText),
            ['# Admissions'].concat(numAdmits),
            ['% of Visits'].concat(percentAdmits),
            ['# Leading to Revisit'].concat(numVisitsCausingReadmit),
            ['% of Visits'].concat(percentVisitsCausingReadmit),
            ], 1, 1);
        drawTable('#meds-table', [
            [''].concat(comparatorRangeText),
            ['# with time to nebs'].concat(nNebs),
            ['# with time to steroids'].concat(nSteroids),
            ], 1, 1);
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

    calcReadmissions = function(data, dayIntervalForReadmit) {
        var lastVisitById = {};
        _.each(data, function(row) {
            row.readmit = 0;
            row.causedReadmit = 0;

            var visitDate = row['Admit'],
                lastVisit = lastVisitById[row.pid],
                lastVisitDate = lastVisit && lastVisit['Admit'] || null;
            
            var causedReadmitMinDate = new Date(visitDate),
                causedReadmitMaxDate = new Date(visitDate);
            causedReadmitMinDate.setDate(causedReadmitMinDate.getDate() - dayIntervalForReadmit[1]);
            causedReadmitMaxDate.setDate(causedReadmitMaxDate.getDate() - dayIntervalForReadmit[0]);

            if (lastVisitDate && (lastVisit.type == 'ER') && (lastVisitDate >= causedReadmitMinDate && lastVisitDate <= causedReadmitMaxDate)) {
                lastVisit.causedReadmit = 1;
                row.readmit = 1;
            }
            lastVisitById[row.pid] = row;
        });
    }
});