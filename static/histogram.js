histogram = function() {
    var defaultRanger = function(values) { 
        return [Math.min.apply(this, values), Math.max.apply(this, values)]; 
    }

    var defaultBinner = function(range, values, numbins) { 
        var b = +range[0],
            n = numbins || Math.ceil(Math.log(values.length) / Math.LN2 + 1),
            m = Math.ceil((range[1] - b) / n),
            f = [];
        for (var x = 0; x <= n; x++) { 
            f.push(m * x + b); 
        }
        return f;
    }

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

    var ranger = defaultRanger,
        binner = defaultBinner;

    var histogram = function(data) {
        var bins = [],
            values = data,
            range = ranger.call(this, values, i),
            thresholds = binner.call(this, range, values, i),
            bin, i = -1,
            n = values.length,
            m = thresholds.length - 1,
            x;
        while (++i < m) {
            bin = bins[i] = [];
            bin.x = thresholds[i];
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
        
        bins.dx = thresholds[1] - thresholds[0];
        bins.values = [];
        for (i = 0; i < bins.length; i++) {
            bins.values.push(bins[i].length);
        }
        return bins;
    }
    histogram.range = function(x) {
        if (!arguments.length) return ranger;
        ranger = (typeof x === "function") ? x : function() { return x; }
        return histogram;
    };
    histogram.bins = function(x) {
        if (!arguments.length) return binner;
        if (typeof x === "number") {
            binner = function(range) { return defaultBinner(range, null, x); }
        } else if (typeof x === "function") {
            binner = x
        } else {
            binner = function() { return x; }
        }
        return histogram;
    };
    histogram.values = function() {
        var v = [], bins = this.bins;

    };
    return histogram;
};
