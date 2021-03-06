'use strict';

angular.module('nestApp.directives')
.directive('ngVenn', ['d3', function(d3) {
   return {
      restrict: 'A',
      require: '^ngModel',
      scope:{
         ngModel:'='
      },
      template: '',
      link: function(scope, iElement, iAttrs, ctrl) {
         scope.$watch('ngModel', function(newValue, oldValue) {
            if (newValue)
               // console.log("I see a data change!");
               scope.getVennVal(scope.ngModel);
         }, true);
      },
      controller: ['$scope', function($scope) {
            $scope.getVennVal = function(values) {
               // console.log(values);
               // draw venn diagram
               var chart = venn.VennDiagram();
               var div = d3.select(".venn_diagram");
               div.datum(values).call(chart);

               // Style the diagram's colors
               d3.selectAll(".venn_diagram .venn-circle path")
                  .style("fill", "#337ab7");
               d3.selectAll(".venn_diagram text")
                  .style("fill", "#337ab7");
               d3.selectAll("path")
                  .style("stroke-opacity", 0)
                  .style("stroke", "#fff")
                  .style("stroke-width", 0);


               // add a tooltip
               var tooltip = d3.select(".venn_diagram").append("div")
                   .attr("class", "venntooltip");

               // add listeners to all the groups to display tooltip on mousover
               d3.selectAll(".venn_diagram g")
                  .on("mouseover", function(d, i) {

                     // Display a tooltip with the current size
                     tooltip.transition().duration(400).style("opacity", .9);
                     tooltip.text(d.size + " users");

                     // highlight the current path
                     var selection = d3.select(this).transition("tooltip").duration(400);
                     selection.select("path")
                        .style("stroke-width", 3)
                        .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
                        .style("stroke-opacity", 1);
                  })

                  .on("mousemove", function() {
                     tooltip.style("left", (d3.event.pageX - 25) + "px").style('position', 'fixed').style("top", (d3.event.pageY - 25) + "px");
                     // tooltip.style('position', 'absolute')
                        // .style('top', '0').style('left','0');
                  })

                  .on("mouseout", function(d, i) {
                    tooltip.transition().duration(400).style("opacity", 0);
                    var selection = d3.select(this).transition("tooltip").duration(400);
                    selection.select("path")
                        .style("stroke-width", 0)
                        .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
                        .style("stroke-opacity", 0);
                  });

            }
            // venn.js courtesy of https://github.com/benfred/venn.js

            var venn = venn || {};

            (function(venn) {
                "use strict";
                venn.VennDiagram = function() {
                    var width = 765,
                        height = 645,
                        padding = 15,
                        duration = 1000,
                        orientation = Math.PI / 2,
                        normalize = true,
                        fontSize = null,
                        colours = d3.scale.category10(),
                        layoutFunction = venn.venn;

                    function chart(selection) {
                        selection.each(function(data) {
                            var solution = layoutFunction(data);
                            if (normalize) {
                                solution = venn.normalizeSolution(solution, orientation);
                            }
                            var circles = venn.scaleSolution(solution, width, height, padding);
                            var textCentres = computeTextCentres(circles, data);

                            // draw out a svg
                            var svg = d3.select(this).selectAll("svg").data([circles]);
                            svg.enter().append("svg");

                            svg.attr("width", width)
                               .attr("height", height);

                            // to properly transition intersection areas, we need the
                            // previous circles locations. load from elements
                            var previous = {}, hasPrevious = false;
                            svg.selectAll("g").each(function (d) {
                                var path = d3.select(this).select("path").attr("d");
                                if ((d.sets.length == 1) && path) {
                                    hasPrevious = true;
                                    previous[d.sets[0]] = venn.circleFromPath(path);
                                }
                            });

                            // interpolate intersection area paths between previous and
                            // current paths
                            var pathTween = function(d) {
                                return function(t) {
                                    var c = d.sets.map(function (set) {
                                        var start = previous[set], end = circles[set];
                                        if (!start) {
                                            start = {x : width/2, y : height/2, radius : 1};
                                        }
                                        if (!end) {
                                            end = {x : width/2, y : height/2, radius : 1};
                                        }
                                        return {'x' : start.x * (1 - t) + end.x * t,
                                                'y' : start.y * (1 - t) + end.y * t,
                                                'radius' : start.radius * (1 - t) + end.radius * t};

                                    });
                                    return venn.intersectionAreaPath(c);
                                };
                            };

                            // update data, joining on the set ids
                            var nodes = svg.selectAll("g")
                                .data(data, function(d) { return d.sets; });

                            // create new nodes
                            var enter = nodes.enter()
                                .append('g')
                                .attr("class", function(d) {
                                    return "venn-area venn-" +
                                        (d.sets.length == 1 ? "circle" : "intersection") +
                                        (" venn-sets-" + d.sets.join("_"));
                                });

                            enter.append("path")
                                .style("fill-opacity", "0")
                                .filter(function (d) { return d.sets.length == 1; } )
                                .style("fill", function(d) { return colours(label(d)); })
                                .style("fill-opacity", ".25");

                            var enterText = enter.append("text")
                                .style("fill", function(d) { return d.sets.length == 1 ? colours(label(d)) : "#444"; })
                                .text(function (d) { return label(d); } )
                                .attr("text-anchor", "middle")
                                .attr("dy", ".35em")
                                .attr("x", width/2)
                                .attr("y", height/2);

                            // update existing
                            var update = nodes.transition("venn").duration(hasPrevious ? duration : 0);
                            update.select("path")
                                .attrTween("d", pathTween);

                            var updateText = update.select("text")
                                .text(function (d) { return label(d); } )
                                .each("end", venn.wrapText(circles, label))
                                .attr("x", function(d) {
                                    return Math.floor(textCentres[d.sets].x);
                                })
                                .attr("y", function(d) {
                                    return Math.floor(textCentres[d.sets].y);
                                });

                            // if we've been passed a fontSize explicitly, use it to
                            // transition
                            if (fontSize !== null) {
                                enterText.style("font-size", "0px");
                                updateText.style("font-size", fontSize);
                            }

                            // remove old
                            var remove = nodes.exit().transition('venn').duration(duration).remove();
                            remove.select("path")
                                .attrTween("d", pathTween);

                            remove.select("text")
                                .text(function (d) { return label(d); } )
                                .attr("x", width/2)
                                .attr("y", height/2)
                                .style("font-size", "0px");
                        });
                    }

                    function label(d) {
                        if (d.label) {
                            return d.label;
                        }
                        if (d.sets.length == 1) {
                            return '' + d.sets[0];
                        }
                    }

                    chart.width = function(_) {
                        if (!arguments.length) return width;
                        width = _;
                        return chart;
                    };

                    chart.height = function(_) {
                        if (!arguments.length) return height;
                        height = _;
                        return chart;
                    };

                    chart.padding = function(_) {
                        if (!arguments.length) return padding;
                        padding = _;
                        return chart;
                    };

                    chart.colours = function(_) {
                        if (!arguments.length) return colours;
                        colours = _;
                        return chart;
                    };

                    chart.fontSize = function(_) {
                        if (!arguments.length) return fontSize;
                        fontSize = _;
                        return chart;
                    };

                    chart.duration = function(_) {
                        if (!arguments.length) return duration;
                        duration = _;
                        return chart;
                    };

                    chart.layoutFunction = function(_) {
                        if (!arguments.length) return layoutFunction;
                        layoutFunction = _;
                        return chart;
                    };

                    chart.normalize = function(_) {
                        if (!arguments.length) return normalize;
                        normalize = _;
                        return chart;
                    };
                    chart.orientation = function(_) {
                        if (!arguments.length) return orientation;
                        orientation = _;
                        return chart;
                    };

                    return chart;
                };
                // sometimes text doesn't fit inside the circle, if thats the case lets wrap
                // the text here such that it fits
                // todo: looks like this might be merged into d3 (
                // https://github.com/mbostock/d3/issues/1642),
                // also worth checking out is
                // http://engineering.findthebest.com/wrapping-axis-labels-in-d3-js/
                // this seems to be one of those things that should be easy but isn't
                venn.wrapText = function(circles, labeller) {
                    return function() {
                        var text = d3.select(this),
                            data = text.datum(),
                            width = circles[data.sets[0]].radius || 50,
                            label = labeller(data) || '';

                            var words = label.split(/\s+/).reverse(),
                            maxLines = 3,
                            minChars = (label.length + words.length) / maxLines,
                            word = words.pop(),
                            line = [word],
                            joined,
                            lineNumber = 0,
                            lineHeight = 1.1, // ems
                            tspan = text.text(null).append("tspan").text(word);

                        while (true) {
                            word = words.pop();
                            if (!word) break;
                            line.push(word);
                            joined = line.join(" ");
                            tspan.text(joined);
                            if (joined.length > minChars && tspan.node().getComputedTextLength() > width) {
                                line.pop();
                                tspan.text(line.join(" "));
                                line = [word];
                                tspan = text.append("tspan").text(word);
                                lineNumber++;
                            }
                        }

                        var initial = 0.35 - lineNumber * lineHeight / 2,
                            x = text.attr("x"),
                            y = text.attr("y");

                        text.selectAll("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", function(d, i) {
                                 return (initial + i * lineHeight) + "em";
                            });
                    };
                };

                function circleMargin(current, interior, exterior) {
                    var margin = interior[0].radius - venn.distance(interior[0], current), i, m;
                    for (i = 1; i < interior.length; ++i) {
                        m = interior[i].radius - venn.distance(interior[i], current);
                        if (m <= margin) {
                            margin = m;
                        }
                    }

                    for (i = 0; i < exterior.length; ++i) {
                        m = venn.distance(exterior[i], current) - exterior[i].radius;
                        if (m <= margin) {
                            margin = m;
                        }
                    }
                    return margin;
                }

                // compute the center of some circles by maximizing the margin of
                // the center point relative to the circles (interior) after subtracting
                // nearby circles (exterior)
                function computeTextCentre(interior, exterior) {
                    // get an initial estimate by sampling around the interior circles
                    // and taking the point with the biggest margin
                    var points = [], i;
                    for (i = 0; i < interior.length; ++i) {
                        var c = interior[i];
                        points.push({x: c.x, y: c.y});
                        points.push({x: c.x + c.radius/2, y: c.y});
                        points.push({x: c.x - c.radius/2, y: c.y});
                        points.push({x: c.x, y: c.y + c.radius/2});
                        points.push({x: c.x, y: c.y - c.radius/2});
                    }
                    var initial = points[0], margin = circleMargin(points[0], interior, exterior);
                    for (i = 1; i < points.length; ++i) {
                        var m = circleMargin(points[i], interior, exterior);
                        if (m >= margin) {
                            initial = points[i];
                            margin = m;
                        }
                    }

                    // maximize the margin numerically
                    var solution = venn.fmin(
                                function(p) { return -1 * circleMargin({x: p[0], y: p[1]}, interior, exterior); },
                                [initial.x, initial.y],
                                {maxIterations:500, minErrorDelta:1e-10}).solution;
                    var ret = {x: solution[0], y: solution[1]};

                    // check solution, fallback as needed (happens if fully overlapped
                    // etc)
                    var valid = true;
                    for (i = 0; i < interior.length; ++i) {
                        if (venn.distance(ret, interior[i]) > interior[i].radius) {
                            valid = false;
                            break;
                        }
                    }

                    for (i = 0; i < exterior.length; ++i) {
                        if (venn.distance(ret, exterior[i]) < exterior[i].radius) {
                            valid = false;
                            break;
                        }
                    }

                    if (!valid) {
                        if (interior.length == 1) {
                            ret = {x: interior[0].x, y: interior[0].y};
                        } else {
                            var areaStats = {};
                            venn.intersectionArea(interior, areaStats);

                            if (areaStats.arcs.length === 0) {
                                ret = {'x': 0, 'y': -1000, disjoint:true};
                            } else {
                                // take avercount of all the points in the intersection
                                // polygon
                                ret = venn.getCenter(areaStats.arcs.map(function (a) { return a.p1; }));
                            }
                        }
                    }

                    return ret;
                }
                venn.computeTextCentre = computeTextCentre;

                function computeTextCentres(circles, areas) {
                    var ret = {};
                    for (var i = 0; i < areas.length; ++i) {
                        var area = areas[i].sets, areaids = {};
                        for (var j = 0; j < area.length; ++j) {
                            areaids[area[j]] = true;
                        }

                        var interior = [], exterior = [];
                        for (var setid in circles) {
                            if (setid in areaids) {
                                interior.push(circles[setid]);
                            } else {
                                exterior.push(circles[setid]);
                            }
                        }
                        var centre = computeTextCentre(interior, exterior);
                        ret[area] = centre;
                        if (centre.disjoint && (areas[i].size > 0)) {
                            console.log("WARNING: area " + area + " not represented on screen");
                        }
                    }
                    return  ret;
                }
                venn.computeTextCentres = computeTextCentres;

                // sorts all areas in the venn diagram, so that
                // a particular area is on top (relativeTo) - and
                // all other areas are so that the smallest areas are on top
                venn.sortAreas = function(div, relativeTo) {
                    // need to sort div's so that Z order is correct
                    div.selectAll("g").sort(function (a, b) {
                        // highest order set intersections first
                        if (a.sets.length != b.sets.length) {
                            return a.sets.length - b.sets.length;
                        }

                        // current element is highest inside its order
                        if ((a == relativeTo) || (b == relativeTo)) {
                            return (a == relativeTo) ? 1 : -1;
                        }

                        // finally by size
                        return b.size - a.size;
                    });
                };

                venn.circlePath = function(x, y, r) {
                    var ret = [];
                    ret.push("\nM", x, y);
                    ret.push("\nm", -r, 0);
                    ret.push("\na", r, r, 0, 1, 0, r *2, 0);
                    ret.push("\na", r, r, 0, 1, 0,-r *2, 0);
                    return ret.join(" ");
                };

                // inverse of the circlePath function, returns a circle object from an svg path
                venn.circleFromPath = function(path) {
                    var tokens = path.split(' ');
                    return {'x' : parseFloat(tokens[1]),
                            'y' : parseFloat(tokens[2]),
                            'radius' : -parseFloat(tokens[4])
                            };
                };

                /** returns a svg path of the intersection area of a bunch of circles */
                venn.intersectionAreaPath = function(circles) {
                    var stats = {};
                    venn.intersectionArea(circles, stats);
                    var arcs = stats.arcs;

                    if (arcs.length === 0) {
                        return "M 0 0";

                    } else if (arcs.length == 1) {
                        var circle = arcs[0].circle;
                        return venn.circlePath(circle.x, circle.y, circle.radius);

                    } else {
                        // draw path around arcs
                        var ret = ["\nM", arcs[0].p2.x, arcs[0].p2.y];
                        for (var i = 0; i < arcs.length; ++i) {
                            var arc = arcs[i], r = arc.circle.radius, wide = arc.width > r;
                            ret.push("\nA", r, r, 0, wide ? 1 : 0, 1,
                                     arc.p1.x, arc.p1.y);
                        }
                        return ret.join(" ");
                    }
                };
            })(venn);

            (function(venn) {
                "use strict";
                /** given a list of set objects, and their corresponding overlaps.
                updates the (x, y, radius) attribute on each set such that their positions
                roughly correspond to the desired overlaps */
                venn.venn = function(areas, parameters) {
                    parameters = parameters || {};
                    parameters.maxIterations = parameters.maxIterations || 500;
                    var lossFunction = parameters.lossFunction || venn.lossFunction;
                    var initialLayout = parameters.initialLayout || venn.greedyLayout;
                    var fmin = parameters.fmin || venn.fmin;

                    // initial layout is done greedily
                    var circles = initialLayout(areas);

                    // transform x/y coordinates to a vector to optimize
                    var initial = [], setids = [], setid;
                    for (setid in circles) {
                        if (circles.hasOwnProperty(setid)) {
                            initial.push(circles[setid].x);
                            initial.push(circles[setid].y);
                            setids.push(setid);
                        }
                    }

                    // optimize initial layout from our loss function
                    var totalFunctionCalls = 0;
                    var solution = fmin(
                        function(values) {
                            totalFunctionCalls += 1;
                            var current = {};
                            for (var i = 0; i < setids.length; ++i) {
                                var setid = setids[i];
                                current[setid] = {x: values[2 * i],
                                                  y: values[2 * i + 1],
                                                  radius : circles[setid].radius,
                                                 // size : circles[setid].size
                                                 };
                            }
                            return lossFunction(current, areas);
                        },
                        initial,
                        parameters);

                    // transform solution vector back to x/y points
                    var positions = solution.solution;
                    for (var i = 0; i < setids.length; ++i) {
                        setid = setids[i];
                        circles[setid].x = positions[2 * i];
                        circles[setid].y = positions[2 * i + 1];
                    }

                    return circles;
                };

                var SMALL = 1e-10;

                /** Returns the distance necessary for two circles of radius r1 + r2 to
                have the overlap area 'overlap' */
                venn.distanceFromIntersectArea = function(r1, r2, overlap) {
                    // handle complete overlapped circles
                    if (Math.min(r1, r2) * Math.min(r1,r2) * Math.PI <= overlap + SMALL) {
                        return Math.abs(r1 - r2);
                    }

                    return venn.bisect(function(distance) {
                        return venn.circleOverlap(r1, r2, distance) - overlap;
                    }, 0, r1 + r2);
                };

                /// gets a matrix of euclidean distances between all sets in venn diagram
                venn.getDistanceMatrix = function(areas, sets, setids) {
                    // initialize an empty distance matrix between all the points
                    var distances = [];
                    for (var i = 0; i < sets.length; ++i) {
                        distances.push([]);
                        for (var j = 0; j < sets.length; ++j) {
                            distances[i].push(0);
                        }
                    }

                    // compute distances between all the points
                    for (i = 0; i < areas.length; ++i) {
                        var current = areas[i];
                        if (current.sets.length !== 2) {
                            continue;
                        }

                        var left = setids[current.sets[0]],
                            right = setids[current.sets[1]],
                            r1 = Math.sqrt(sets[left].size / Math.PI),
                            r2 = Math.sqrt(sets[right].size / Math.PI),
                            distance = venn.distanceFromIntersectArea(r1, r2, current.size);

                        distances[left][right] = distances[right][left] = distance;
                    }
                    return distances;
                };

                /** Lays out a Venn diagram greedily, going from most overlapped sets to
                least overlapped, attempting to position each new set such that the
                overlapping areas to already positioned sets are basically right */
                venn.greedyLayout = function(areas) {
                    // define a circle for each set
                    var circles = {}, setOverlaps = {}, set;
                    for (var i = 0; i < areas.length; ++i) {
                        var area = areas[i];
                        if (area.sets.length == 1) {
                            set = area.sets[0];
                            circles[set] = {x: 1e10, y: 1e10,
                                            rowid: circles.length,
                                            size: area.size,
                                            radius: Math.sqrt(area.size / Math.PI)};
                            setOverlaps[set] = [];
                        }
                    }
                    areas = areas.filter(function(a) { return a.sets.length == 2; });

                    // map each set to a list of all the other sets that overlap it
                    for (i = 0; i < areas.length; ++i) {
                        var current = areas[i];
                        var weight = current.hasOwnProperty('weight') ? current.weight : 1.0;
                        var left = current.sets[0], right = current.sets[1];

                        // completely overlapped circles shouldn't be positioned early here
                        if (current.size + SMALL >= Math.min(circles[left].size,
                                                             circles[right].size)) {
                            weight = 0;
                        }

                        setOverlaps[left].push ({set:right, size:current.size, weight:weight});
                        setOverlaps[right].push({set:left,  size:current.size, weight:weight});
                    }

                    // get list of most overlapped sets
                    var mostOverlapped = [];
                    for (set in setOverlaps) {
                        if (setOverlaps.hasOwnProperty(set)) {
                            var size = 0;
                            for (i = 0; i < setOverlaps[set].length; ++i) {
                                size += setOverlaps[set][i].size * setOverlaps[set][i].weight;
                            }

                            mostOverlapped.push({set: set, size:size});
                        }
                    }

                    // sort by size desc
                    function sortOrder(a,b) {
                        return b.size - a.size;
                    }
                    mostOverlapped.sort(sortOrder);

                    // keep track of what sets have been laid out
                    var positioned = {};
                    function isPositioned(element) {
                        return element.set in positioned;
                    }

                    // adds a point to the output
                    function positionSet(point, index) {
                        circles[index].x = point.x;
                        circles[index].y = point.y;
                        positioned[index] = true;
                    }

                    // add most overlapped set at (0,0)
                    positionSet({x: 0, y: 0}, mostOverlapped[0].set);

                    // get distances between all points. TODO, necessary?
                    // answer: probably not
                    // var distances = venn.getDistanceMatrix(circles, areas);
                    for (i = 1; i < mostOverlapped.length; ++i) {
                        var setIndex = mostOverlapped[i].set,
                            overlap = setOverlaps[setIndex].filter(isPositioned);
                        set = circles[setIndex];
                        overlap.sort(sortOrder);

                        if (overlap.length === 0) {
                            throw "Need overlap information for set " + JSON.stringify( set );
                        }

                        var points = [];
                        for (var j = 0; j < overlap.length; ++j) {
                            // get appropriate distance from most overlapped already added set
                            var p1 = circles[overlap[j].set],
                                d1 = venn.distanceFromIntersectArea(set.radius, p1.radius,
                                                                    overlap[j].size);

                            // sample positions at 90 degrees for maximum aesthetics
                            points.push({x : p1.x + d1, y : p1.y});
                            points.push({x : p1.x - d1, y : p1.y});
                            points.push({y : p1.y + d1, x : p1.x});
                            points.push({y : p1.y - d1, x : p1.x});

                            // if we have at least 2 overlaps, then figure out where the
                            // set should be positioned analytically and try those too
                            for (var k = j + 1; k < overlap.length; ++k) {
                                var p2 = circles[overlap[k].set],
                                    d2 = venn.distanceFromIntersectArea(set.radius, p2.radius,
                                                                        overlap[k].size);

                                var extraPoints = venn.circleCircleIntersection(
                                    { x: p1.x, y: p1.y, radius: d1},
                                    { x: p2.x, y: p2.y, radius: d2});

                                for (var l = 0; l < extraPoints.length; ++l) {
                                    points.push(extraPoints[l]);
                                }
                            }
                        }

                        // we have some candidate positions for the set, examine loss
                        // at each position to figure out where to put it at
                        var bestLoss = 1e50, bestPoint = points[0];
                        for (j = 0; j < points.length; ++j) {
                            circles[setIndex].x = points[j].x;
                            circles[setIndex].y = points[j].y;
                            var loss = venn.lossFunction(circles, areas);
                            if (loss < bestLoss) {
                                bestLoss = loss;
                                bestPoint = points[j];
                            }
                        }

                        positionSet(bestPoint, setIndex);
                    }

                    return circles;
                };

                /// Uses multidimensional scaling to approximate a first layout here
                venn.classicMDSLayout = function(areas) {
                    // bidirectionally map sets to a rowid  (so we can create a matrix)
                    var sets = [], setids = {};
                    for (var i = 0; i < areas.length; ++i ) {
                        var area = areas[i];
                        if (area.sets.length == 1) {
                            setids[area.sets[0]] = sets.length;
                            sets.push(area);
                        }
                    }

                    // get the distance matrix, and use to position sets
                    var distances = venn.getDistanceMatrix(areas, sets, setids);
                    var positions = mds.classic(distances);

                    // translate rows back to (x,y,radius) coordinates
                    var circles = {};
                    for (i = 0; i < sets.length; ++i) {
                        var set = sets[i];
                        circles[set.sets[0]] = {
                            x: positions[i][0],
                            y: positions[i][1],
                            radius:  Math.sqrt(set.size / Math.PI)
                        };
                    }
                    return circles;
                };

                /** Given a bunch of sets, and the desired overlaps between these sets - computes
                the distance from the actual overlaps to the desired overlaps. Note that
                this method ignores overlaps of more than 2 circles */
                venn.lossFunction = function(sets, overlaps) {
                    var output = 0;

                    function getCircles(indices) {
                        return indices.map(function(i) { return sets[i]; });
                    }

                    for (var i = 0; i < overlaps.length; ++i) {
                        var area = overlaps[i], overlap;
                        if (area.sets.length == 1) {
                            continue;
                        } else if (area.sets.length == 2) {
                            var left = sets[area.sets[0]],
                                right = sets[area.sets[1]];
                            overlap = venn.circleOverlap(left.radius, right.radius,
                                                         venn.distance(left, right));
                        } else {
                            overlap = venn.intersectionArea(getCircles(area.sets));
                        }

                        var weight = area.hasOwnProperty('weight') ? area.weight : 1.0;
                        output += weight * (overlap - area.size) * (overlap - area.size);
                    }

                    return output;
                };

                // orientates a bunch of circles to point in orientation
                function orientateCircles(circles, orientation) {
                    // sort circles by size
                    circles.sort(function (a, b) { return b.radius - a.radius; });

                    var i;
                    // shift circles so largest circle is at (0, 0)
                    if (circles.length > 0) {
                        var largestX = circles[0].x,
                            largestY = circles[0].y;

                        for (i = 0; i < circles.length; ++i) {
                            circles[i].x -= largestX;
                            circles[i].y -= largestY;
                        }
                    }

                    // rotate circles so that second largest is at an angle of 'orientation'
                    // from largest
                    if (circles.length > 1) {
                        var rotation = Math.atan2(circles[1].x, circles[1].y) - orientation,
                            c = Math.cos(rotation),
                            s = Math.sin(rotation), x, y;

                        for (i = 0; i < circles.length; ++i) {
                            x = circles[i].x;
                            y = circles[i].y;
                            circles[i].x = c * x - s * y;
                            circles[i].y = s * x + c * y;
                        }
                    }

                    // mirror solution if third solution is above plane specified by
                    // first two circles
                    if (circles.length > 2) {
                        var angle = Math.atan2(circles[2].x, circles[2].y) - orientation;
                        while (angle < 0) { angle += 2* Math.PI; }
                        while (angle > 2*Math.PI) { angle -= 2* Math.PI; }
                        if (angle > Math.PI) {
                            var slope = circles[1].y / (1e-10 + circles[1].x);
                            for (i = 0; i < circles.length; ++i) {
                                var d = (circles[i].x + slope * circles[i].y) / (1 + slope*slope);
                                circles[i].x = 2 * d - circles[i].x;
                                circles[i].y = 2 * d * slope - circles[i].y;
                            }
                        }
                    }
                }

                venn.disjointCluster = function(circles) {
                    // union-find clustering to get disjoint sets
                    circles.map(function(circle) { circle.parent = circle; });

                    // path compression step in union find
                    function find(circle) {
                        if (circle.parent !== circle) {
                            circle.parent = find(circle.parent);
                        }
                        return circle.parent;
                    }

                    function union(x, y) {
                        var xRoot = find(x), yRoot = find(y);
                        xRoot.parent = yRoot;
                    }

                    // get the union of all overlapping sets
                    for (var i = 0; i < circles.length; ++i) {
                        for (var j = i + 1; j < circles.length; ++j) {
                            var maxDistance = circles[i].radius + circles[j].radius;
                            if (venn.distance(circles[i], circles[j]) + 1e-10 < maxDistance) {
                                union(circles[j], circles[i]);
                            }
                        }
                    }

                    // find all the disjoint clusters and group them together
                    var disjointClusters = {}, setid;
                    for (i = 0; i < circles.length; ++i) {
                        setid = find(circles[i]).parent.setid;
                        if (!(setid in disjointClusters)) {
                            disjointClusters[setid] = [];
                        }
                        disjointClusters[setid].push(circles[i]);
                    }

                    // cleanup bookkeeping
                    circles.map(function(circle) { delete circle.parent; });

                    // return in more usable form
                    var ret = [];
                    for (setid in disjointClusters) {
                        if (disjointClusters.hasOwnProperty(setid)) {
                            ret.push(disjointClusters[setid]);
                        }
                    }
                    return ret;
                };

                function getBoundingBox(circles) {
                    var minMax = function(d) {
                        var hi = Math.max.apply(null, circles.map(
                                                function(c) { return c[d] + c.radius; } )),
                            lo = Math.min.apply(null, circles.map(
                                                function(c) { return c[d] - c.radius;} ));
                        return {max:hi, min:lo};
                    };

                    return {xRange: minMax('x'), yRange: minMax('y')};
                }

                venn.normalizeSolution = function(solution, orientation) {
                    orientation = orientation || Math.PI/2;

                    // work with a list instead of a dictionary, and take a copy so we
                    // don't mutate input
                    var circles = [], i, setid;
                    for (setid in solution) {
                        if (solution.hasOwnProperty(setid)) {
                            var previous = solution[setid];
                            circles.push({x: previous.x,
                                          y: previous.y,
                                          radius: previous.radius,
                                          setid: setid});
                        }
                    }

                    // get all the disjoint clusters
                    var clusters = venn.disjointCluster(circles);

                    // orientate all disjoint sets, get sizes
                    for (i = 0; i < clusters.length; ++i) {
                        orientateCircles(clusters[i], orientation);
                        var bounds = getBoundingBox(clusters[i]);
                        clusters[i].size = (bounds.xRange.max - bounds.xRange.min) * (bounds.yRange.max - bounds.yRange.min);
                        clusters[i].bounds = bounds;
                    }
                    clusters.sort(function(a, b) { return b.size - a.size; });

                    // orientate the largest at 0,0, and get the bounds
                    circles = clusters[0];
                    var returnBounds = circles.bounds;

                    var spacing = (returnBounds.xRange.max - returnBounds.xRange.min)/50;

                    function addCluster(cluster, right, bottom) {
                        if (!cluster) return;

                        var bounds = cluster.bounds, xOffset, yOffset, centreing;

                        if (right) {
                            xOffset = returnBounds.xRange.max  - bounds.xRange.min + spacing;
                        } else {
                            xOffset = returnBounds.xRange.max  - bounds.xRange.max - spacing;
                            centreing = (bounds.xRange.max - bounds.xRange.min) / 2 -
                                        (returnBounds.xRange.max - returnBounds.xRange.min) / 2;
                            if (centreing < 0) xOffset += centreing;
                        }

                        if (bottom) {
                            yOffset = returnBounds.yRange.max  - bounds.yRange.min + spacing;
                        } else {
                            yOffset = returnBounds.yRange.max  - bounds.yRange.max - spacing;
                            centreing = (bounds.yRange.max - bounds.yRange.min) / 2 -
                                        (returnBounds.yRange.max - returnBounds.yRange.min) / 2;
                            if (centreing < 0) yOffset += centreing;
                        }

                        for (var j = 0; j < cluster.length; ++j) {
                            cluster[j].x += xOffset;
                            cluster[j].y += yOffset;
                            circles.push(cluster[j]);
                        }
                    }

                    var index = 1;
                    while (index < clusters.length) {
                        addCluster(clusters[index], true, false);
                        addCluster(clusters[index+1], false, true);
                        addCluster(clusters[index+2], true, true);
                        index += 3;

                        // have one cluster (in top left). lay out next three relative
                        // to it in a grid
                        returnBounds = getBoundingBox(circles);
                    }

                    // convert back to solution form
                    var ret = {};
                    for (i = 0; i < circles.length; ++i) {
                        ret[circles[i].setid] = circles[i];
                    }
                    return ret;
                };

                /** Scales a solution from venn.venn or venn.greedyLayout such that it fits in
                a rectangle of width/height - with padding around the borders. also
                centers the diagram in the available space at the same time */
                venn.scaleSolution = function(solution, width, height, padding) {
                    var circles = [], setids = [];
                    for (var setid in solution) {
                        if (solution.hasOwnProperty(setid)) {
                            setids.push(setid);
                            circles.push(solution[setid]);
                        }
                    }

                    width -= 2*padding;
                    height -= 2*padding;

                    var bounds = getBoundingBox(circles),
                        xRange = bounds.xRange,
                        yRange = bounds.yRange,
                        xScaling = width  / (xRange.max - xRange.min),
                        yScaling = height / (yRange.max - yRange.min),
                        scaling = Math.min(yScaling, xScaling),

                        // while we're at it, center the diagram too
                        xOffset = (width -  (xRange.max - xRange.min) * scaling) / 2,
                        yOffset = (height - (yRange.max - yRange.min) * scaling) / 2;

                    var scaled = {};
                    for (var i = 0; i < circles.length; ++i) {
                        var circle = circles[i];
                        scaled[setids[i]] = {
                            radius: scaling * circle.radius,
                            x: padding + xOffset + (circle.x - xRange.min) * scaling,
                            y: padding + yOffset + (circle.y - yRange.min) * scaling,
                        };
                    }

                    return scaled;
                };
            })(venn);

            (function(venn) {
                "use strict";
                /** finds the zeros of a function, given two starting points (which must
                 * have opposite signs */
                venn.bisect = function(f, a, b, parameters) {
                    parameters = parameters || {};
                    var maxIterations = parameters.maxIterations || 100,
                        tolerance = parameters.tolerance || 1e-10,
                        fA = f(a),
                        fB = f(b),
                        delta = b - a;

                    if (fA * fB > 0) {
                        throw "Initial bisect points must have opposite signs";
                    }

                    if (fA === 0) return a;
                    if (fB === 0) return b;

                    for (var i = 0; i < maxIterations; ++i) {
                        delta /= 2;
                        var mid = a + delta,
                            fMid = f(mid);

                        if (fMid * fA >= 0) {
                            a = mid;
                        }

                        if ((Math.abs(delta) < tolerance) || (fMid === 0)) {
                            return mid;
                        }
                    }
                    return a + delta;
                };

                function weightedSum(ret, w1, v1, w2, v2) {
                    for (var j = 0; j < ret.length; ++j) {
                        ret[j] = w1 * v1[j] + w2 * v2[j];
                    }
                }

                /** minimizes a function using the downhill simplex method */
                venn.fmin = function(f, x0, parameters) {
                    parameters = parameters || {};

                    var maxIterations = parameters.maxIterations || x0.length * 200,
                        nonZeroDelta = parameters.nonZeroDelta || 1.1,
                        zeroDelta = parameters.zeroDelta || 0.001,
                        minErrorDelta = parameters.minErrorDelta || 1e-6,
                        rho = parameters.rho || 1,
                        chi = parameters.chi || 2,
                        psi = parameters.psi || -0.5,
                        sigma = parameters.sigma || 0.5,
                        callback = parameters.callback,
                        temp;

                    // initialize simplex.
                    var N = x0.length,
                        simplex = new Array(N + 1);
                    simplex[0] = x0;
                    simplex[0].fx = f(x0);
                    for (var i = 0; i < N; ++i) {
                        var point = x0.slice();
                        point[i] = point[i] ? point[i] * nonZeroDelta : zeroDelta;
                        simplex[i+1] = point;
                        simplex[i+1].fx = f(point);
                    }

                    var sortOrder = function(a, b) { return a.fx - b.fx; };

                    var centroid = x0.slice(),
                        reflected = x0.slice(),
                        contracted = x0.slice(),
                        expanded = x0.slice();

                    for (var iteration = 0; iteration < maxIterations; ++iteration) {
                        simplex.sort(sortOrder);
                        if (callback) {
                            callback(simplex);
                        }

                        if (Math.abs(simplex[0].fx - simplex[N].fx) < minErrorDelta) {
                            break;
                        }

                        // compute the centroid of all but the worst point in the simplex
                        for (i = 0; i < N; ++i) {
                            centroid[i] = 0;
                            for (var j = 0; j < N; ++j) {
                                centroid[i] += simplex[j][i];
                            }
                            centroid[i] /= N;
                        }

                        // reflect the worst point past the centroid  and compute loss at reflected
                        // point
                        var worst = simplex[N];
                        weightedSum(reflected, 1+rho, centroid, -rho, worst);
                        reflected.fx = f(reflected);

                        // if the reflected point is the best seen, then possibly expand
                        if (reflected.fx <= simplex[0].fx) {
                            weightedSum(expanded, 1+chi, centroid, -chi, worst);
                            expanded.fx = f(expanded);
                            if (expanded.fx < reflected.fx) {
                                temp = simplex[N];
                                simplex[N] = expanded;
                                expanded = temp;
                            }  else {
                                temp = simplex[N];
                                simplex[N] = reflected;
                                reflected = temp;
                            }
                        }

                        // if the reflected point is worse than the second worst, we need to
                        // contract
                        else if (reflected.fx >= simplex[N-1].fx) {
                            var shouldReduce = false;

                            if (reflected.fx <= worst.fx) {
                                // do an inside contraction
                                weightedSum(contracted, 1+psi, centroid, -psi, worst);
                                contracted.fx = f(contracted);
                                if (contracted.fx < worst.fx) {
                                    temp = simplex[N];
                                    simplex[N] = contracted;
                                    contracted = temp;
                                } else {
                                    shouldReduce = true;
                                }
                            } else {
                                // do an outside contraction
                                weightedSum(contracted, 1-psi * rho, centroid, psi*rho, worst);
                                contracted.fx = f(contracted);
                                if (contracted.fx <= reflected.fx) {
                                    temp = simplex[N];
                                    simplex[N] = contracted;
                                    contracted = temp;
                                } else {
                                    shouldReduce = true;
                                }
                            }

                            if (shouldReduce) {
                                // do reduction. doesn't actually happen that often
                                for (i = 1; i < simplex.length; ++i) {
                                    weightedSum(simplex[i], 1 - sigma, simplex[0], sigma - 1, simplex[i]);
                                    simplex[i].fx = f(simplex[i]);
                                }
                            }
                        } else {
                            temp = simplex[N];
                            simplex[N] = reflected;
                            reflected = temp;
                        }

                    }

                    simplex.sort(sortOrder);
                    return {f : simplex[0].fx,
                            solution : simplex[0]};
                };
            })(venn);

            (function(venn) {
                "use strict";
                var SMALL = 1e-10;

                /** Returns the intersection area of a bunch of circles (where each circle
                 is an object having an x,y and radius property) */
                venn.intersectionArea = function(circles, stats) {
                    // get all the intersection points of the circles
                    var intersectionPoints = getIntersectionPoints(circles);

                    // filter out points that aren't included in all the circles
                    var innerPoints = intersectionPoints.filter(function (p) {
                        return venn.containedInCircles(p, circles);
                    });

                    var arcArea = 0, polygonArea = 0, arcs = [], i;

                    // if we have intersection points that are within all the circles,
                    // then figure out the area contained by them
                    if (innerPoints.length > 1) {
                        // sort the points by angle from the center of the polygon, which lets
                        // us just iterate over points to get the edges
                        var center = venn.getCenter(innerPoints);
                        for (i = 0; i < innerPoints.length; ++i ) {
                            var p = innerPoints[i];
                            p.angle = Math.atan2(p.x - center.x, p.y - center.y);
                        }
                        innerPoints.sort(function(a,b) { return b.angle - a.angle;});

                        // iterate over all points, get arc between the points
                        // and update the areas
                        var p2 = innerPoints[innerPoints.length - 1];
                        for (i = 0; i < innerPoints.length; ++i) {
                            var p1 = innerPoints[i];

                            // polygon area updates easily ...
                            polygonArea += (p2.x + p1.x) * (p1.y - p2.y);

                            // updating the arc area is a little more involved
                            var midPoint = {x : (p1.x + p2.x) / 2,
                                            y : (p1.y + p2.y) / 2},
                                arc = null;

                            for (var j = 0; j < p1.parentIndex.length; ++j) {
                                if (p2.parentIndex.indexOf(p1.parentIndex[j]) > -1) {
                                    // figure out the angle halfway between the two points
                                    // on the current circle
                                    var circle = circles[p1.parentIndex[j]],
                                        a1 = Math.atan2(p1.x - circle.x, p1.y - circle.y),
                                        a2 = Math.atan2(p2.x - circle.x, p2.y - circle.y);

                                    var angleDiff = (a2 - a1);
                                    if (angleDiff < 0) {
                                        angleDiff += 2*Math.PI;
                                    }

                                    // and use that angle to figure out the width of the
                                    // arc
                                    var a = a2 - angleDiff/2,
                                        width = venn.distance(midPoint, {
                                            x : circle.x + circle.radius * Math.sin(a),
                                            y : circle.y + circle.radius * Math.cos(a)
                                        });

                                    // pick the circle whose arc has the smallest width
                                    if ((arc === null) || (arc.width > width)) {
                                        arc = { circle : circle,
                                                width : width,
                                                p1 : p1,
                                                p2 : p2};
                                    }
                                }
                            }
                            arcs.push(arc);
                            arcArea += venn.circleArea(arc.circle.radius, arc.width);
                            p2 = p1;
                        }
                    } else {
                        // no intersection points, is either disjoint - or is completely
                        // overlapped. figure out which by examining the smallest circle
                        var smallest = circles[0];
                        for (i = 1; i < circles.length; ++i) {
                            if (circles[i].radius < smallest.radius) {
                                smallest = circles[i];
                            }
                        }

                        // make sure the smallest circle is completely contained in all
                        // the other circles
                        var disjoint = false;
                        for (i = 0; i < circles.length; ++i) {
                            if (venn.distance(circles[i], smallest) > Math.abs(smallest.radius - circles[i].radius)) {
                                disjoint = true;
                                break;
                            }
                        }

                        if (disjoint) {
                            arcArea = polygonArea = 0;

                        } else {
                            arcArea = smallest.radius * smallest.radius * Math.PI;
                            arcs.push({circle : smallest,
                                       p1: { x: smallest.x,        y : smallest.y + smallest.radius},
                                       p2: { x: smallest.x - SMALL, y : smallest.y + smallest.radius},
                                       width : smallest.radius * 2 });
                        }
                    }

                    polygonArea /= 2;
                    if (stats) {
                        stats.area = arcArea + polygonArea;
                        stats.arcArea = arcArea;
                        stats.polygonArea = polygonArea;
                        stats.arcs = arcs;
                        stats.innerPoints = innerPoints;
                        stats.intersectionPoints = intersectionPoints;
                    }

                    return arcArea + polygonArea;
                };

                /** returns whether a point is contained by all of a list of circles */
                venn.containedInCircles = function(point, circles) {
                    for (var i = 0; i < circles.length; ++i) {
                        if (venn.distance(point, circles[i]) > circles[i].radius + SMALL) {
                            return false;
                        }
                    }
                    return true;
                };

                /** Gets all intersection points between a bunch of circles */
                function getIntersectionPoints(circles) {
                    var ret = [];
                    for (var i = 0; i < circles.length; ++i) {
                        for (var j = i + 1; j < circles.length; ++j) {
                            var intersect = venn.circleCircleIntersection(circles[i],
                                                                          circles[j]);
                            for (var k = 0; k < intersect.length; ++k) {
                                var p = intersect[k];
                                p.parentIndex = [i,j];
                                ret.push(p);
                            }
                        }
                    }
                    return ret;
                }

                venn.circleIntegral = function(r, x) {
                    var y = Math.sqrt(r * r - x * x);
                    return x * y + r * r * Math.atan2(x, y);
                };

                /** Returns the area of a circle of radius r - up to width */
                venn.circleArea = function(r, width) {
                    return venn.circleIntegral(r, width - r) - venn.circleIntegral(r, -r);
                };


                /** euclidean distance between two points */
                venn.distance = function(p1, p2) {
                    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) +
                                     (p1.y - p2.y) * (p1.y - p2.y));
                };


                /** Returns the overlap area of two circles of radius r1 and r2 - that
                have their centers separated by distance d. Simpler faster
                circle intersection for only two circles */
                venn.circleOverlap = function(r1, r2, d) {
                    // no overlap
                    if (d >= r1 + r2) {
                        return 0;
                    }

                    // completely overlapped
                    if (d <= Math.abs(r1 - r2)) {
                        return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
                    }

                    var w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d),
                        w2 = r2 - (d * d - r1 * r1 + r2 * r2) / (2 * d);
                    return venn.circleArea(r1, w1) + venn.circleArea(r2, w2);
                };


                /** Given two circles (containing a x/y/radius attributes),
                returns the intersecting points if possible.
                note: doesn't handle cases where there are infinitely many
                intersection points (circles are equivalent):, or only one intersection point*/
                venn.circleCircleIntersection = function(p1, p2) {
                    var d = venn.distance(p1, p2),
                        r1 = p1.radius,
                        r2 = p2.radius;

                    // if to far away, or self contained - can't be done
                    if ((d >= (r1 + r2)) || (d <= Math.abs(r1 - r2))) {
                        return [];
                    }

                    var a = (r1 * r1 - r2 * r2 + d * d) / (2 * d),
                        h = Math.sqrt(r1 * r1 - a * a),
                        x0 = p1.x + a * (p2.x - p1.x) / d,
                        y0 = p1.y + a * (p2.y - p1.y) / d,
                        rx = -(p2.y - p1.y) * (h / d),
                        ry = -(p2.x - p1.x) * (h / d);

                    return [{ x: x0 + rx, y : y0 - ry },
                            { x: x0 - rx, y : y0 + ry }];
                };

                /** Returns the center of a bunch of points */
                venn.getCenter = function(points) {
                    var center = { x: 0, y: 0};
                    for (var i =0; i < points.length; ++i ) {
                        center.x += points[i].x;
                        center.y += points[i].y;
                    }
                    center.x /= points.length;
                    center.y /= points.length;
                    return center;
                };
            })(venn);

            (function(lib) {
                if (typeof module === "undefined" || typeof module.exports === "undefined") {
                    window.venn = lib;
                } else {
                    module.exports = lib;
                }
            })(venn);

      }]
   }

}])
.directive('barChart', ['d3', function(d3) {
   return {
      restrict: 'E',
      scope:{
         data:'=',
         current:'@',
         onClick:'&'
      },
      template: '<div class="bar_chart"><h4>Evolution over time</h4></div>',
      link: function(scope, iElement, iAttrs) {

         // Courtesy of http://github.com/DeBraid/www.cacheflow.ca


         // watch for data changes and re-render
         scope.$watch('data', function(newVals, oldVals) {
            if (newVals) {
               scope.render(newVals);
            }
         }, true);

         // watch for data changes and re-render
         scope.$watch('current', function(newVals, oldVals) {
            if (newVals) {
               scope.updateView(newVals);
            }
         }, true);

         scope.updateView = function(t){
            var layer = d3.selectAll(".layer");
            var rect = layer.selectAll('rect')
               .on("click", function(d, i){
                  return scope.onClick({item: i});
               })
               .on("mouseover", function(d, i) {
                  // highlight the current path
                  var selection = d3.selectAll("rect")
                  .filter(function(d) { return d.x == i; })
                  .filter(function(d) { return d.x != scope.current; })
                  .transition()
                     .duration(400) // time of duration
                     .style("opacity", 1);
               })

               .on("mouseout", function(d, i) {
                  var selection = d3.selectAll("rect")
                  .filter(function(d) { return d.x == i; })
                  .filter(function(d) { return d.x != scope.current; })
                  .transition()
                    .duration(400) // time of duration
                    .style("opacity", 0.5);
               });

               var today = d3.selectAll("rect")
                  .style("opacity", 0.5)
                  .filter(function(d) { return d.x == scope.current; })
                  .style("opacity", 1);
         };

         scope.render = function(data){
            var margin = {top: 15, right: 15, bottom: 15, left: 15},
            width = 1520 - margin.left - margin.right,
            height = 220 - margin.top - margin.bottom;

            var svg = d3.select(".bar_chart").append("svg")
               .attr("width", width + margin.left + margin.right)
               .attr("height", height + margin.top + margin.bottom)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var headers = ["Retweets","Favorites","Replies"];

            var layers = d3.layout.stack()(headers.map(function(count) {
               return data.map(function(d) {
                  return {x: d.Day, y: +d[count]};
               });
            }));
            var yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

            var xScale = d3.scale.ordinal()
               .domain(layers[0].map(function(d) { return d.x; }))
               .rangeRoundBands([25, width], .08);

            var y = d3.scale.linear()
               .domain([1, yStackMax])
               .range([height, 0]);

            var color = d3.scale.ordinal()
               .domain(headers)
               .range(["#77b255", "#ffac33","#07c"]);

            var layer = svg.selectAll(".layer")
               .data(layers)
               .enter().append("g")
               .attr("class", "layer")
               .style("fill", function(d, i) { return color(i); });

            var rect = layer.selectAll("rect")
               .data(function(d) { return d; })
               .enter().append("rect")
               .attr("x", function(d) { return xScale(d.x); })
               .attr("y", height)
               .attr("width", xScale.rangeBand())
               .attr("height", 0)
               .style("opacity",0.5);


            rect.transition()
               .delay(function(d, i) { return i * 10; })
               .attr("y", function(d) { return y(d.y0 + d.y); })
               .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });


            var legend = svg.selectAll(".legend")
               .data(headers.slice().reverse())
               .enter().append("g")
               .attr("class", "legend")
               .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

            legend.append("rect")
               .attr("x", 0)
               .attr("width", 18)
               .attr("height", 18)
               .style("fill", color)
               .style("opacity",0.5);

            legend.append("text")
               .attr("x", 90)
               .attr("y", 9)
               .attr("dy", ".35em")
               .style("text-anchor", "end")
               .text(function(d) { return d;  });
         };
      }
   }
}])
.directive('pieChart', ['d3', function(d3) {
    return {
        restrict: 'E',
        scope: {
            data: '=',
            max: '@',
            item: '@',
        },
        template: '<div class="pie_chart"></div>',
        link: function(scope, iElement, iAttrs) {


            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
                if (newVals) {
                    scope.render(newVals);
                }
            }, true);

            scope.render = function(data) {

                // Slightly modified code courtesy of https://gist.github.com/enjalot/1203641

                var vis = d3.selectAll(".pie_chart")
                    .each(function(d, i) {
                        if (scope.item == i) {
                            var w = 50, //width
                                h = 50, //height
                                normalized = 50 * (data.Engagement) / (scope.max),
                                r = normalized/2, // adapt radius to engagement value
                                color = d3.scale.ordinal().range(["#77b255", "#ffac33", "#07c"]); //custom range of colors

                            // map data to to be used by pie chart directive
                            var mapped = [{
                                "label": "Retweets",
                                "value": data.Retweets
                            }, {
                                "label": "Favorites",
                                "value": data.Favorites
                            }, {
                                "label": "Replies",
                                "value": data.Replies
                            }];
                            var vis = d3.select(this)
                                .append("svg:svg") //create the SVG element inside the template
                                .data([mapped]) //associate our data with the document
                                .attr("width", w) //set the width and height of our visualization (these will be attributes of the <svg> tag
                                .attr("height", h)
                                .append("svg:g") //make a group to hold our pie chart
                                .attr("transform", "translate(" + (w/2) + "," + (h/2) + ")"); //move the center of the pie chart from 0, 0 to radius, radius

                            var arc = d3.svg.arc() //this will create <path> elements for us using arc data
                                .outerRadius(r);

                            var pie = d3.layout.pie() //this will create arc data for us given a list of values
                                .value(function(d) {
                                    return d.value;
                                }); //we must tell it out to access the value of each element in our data array

                            var arcs = vis.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
                                .data(pie) //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
                                .enter() //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                                .append("svg:g") //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                                .attr("class", "slice"); //allow us to style things in the slices (like text)

                            arcs.append("svg:path")
                                .attr("fill", function(d, i) {
                                    return color(i);
                                }) //set the color for each slice to be chosen from the color function defined above
                                .attr("d", arc); //this creates the actual SVG path using the associated data (pie) with the arc drawing function
                        }
                    })
            };
        }
    }
}]);
