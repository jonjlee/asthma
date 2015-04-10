histogram = function() {
    var d3_layout_histogramBinSturges = function(range, values) { 
        return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1)); 
    }
    var d3_layout_histogramBinFixed = function(range, n) {
        var x = -1, b = +range[0], m = Math.ceil((range[1] - b) / n), f = [];
        while (++x <= n) f[x] = m * x + b;
        return f;
    }
    var d3_layout_histogramRange = function(values) { return [Math.min.apply(this, values), Math.max.apply(this, values)]; }
    var bisect = function(arr, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = arr.length;
        while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (x < arr[mid]) { hi = mid; }
            else { lo = mid + 1; }
        }
        return lo;
    }

    var valuer = Number,
        ranger = d3_layout_histogramRange,
        binner = d3_layout_histogramBinSturges;

    var histogram = function(data) {
        var bins = [],
            values = data.map(valuer, this).filter(function(v) { return typeof v === 'number'; }),
            range = ranger.call(this, values, i),
            thresholds = binner.call(this, range, values, i),
            bin, i = -1,
            n = values.length,
            m = thresholds.length - 1,
            x;
        while (++i < m) {
            bin = bins[i] = [];
            bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
            bin.y = 0;
        }
        if (m > 0) {
            i = -1;
            while (++i < n) {
                x = values[i];
                if (x !== undefined && x >= range[0] && x <= range[1]) {
                    bin = bins[bisect(thresholds, x, 1, m) - 1];
                    bin.y += 1;
                    bin.push(data[i]);
                }
            }
        }
        return bins;
    }
    histogram.value = function(x) {
        if (!arguments.length) return valuer;
        valuer = (typeof x === "function") ? x : function() { return x; };
        return histogram;
    };
    histogram.range = function(x) {
        if (!arguments.length) return ranger;
        ranger = (typeof x === "function") ? x : function() { return x; }
        return histogram;
    };
    histogram.bins = function(x) {
        if (!arguments.length) return binner;
        if (typeof x === "number") {
            binner = function(range) {
                return d3_layout_histogramBinFixed(range, x);
            }
        } else if (typeof x === "function") {
            binner = x
        } else {
            binner = function() { return x; }
        }
        return histogram;
    };
    return histogram;
};
