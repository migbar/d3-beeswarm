import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';

import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

import { join, translateX } from 'ember-cli-d3/utils/d3';

export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  layout: hbs`{{yield contentWidth contentHeight}}`,

  nodes: Ember.computed('contentWidth', 'contentHeight', function() {
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    return d3.range(10).map(function() {
      var true_x = Math.random() * (width * 0.7) + 150;
      return {
        radius: Math.random() * 12 + 4,
        x: true_x,
        true_y: height / 2,
        true_x: true_x }
      });
  }),

  call(selection) {
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');
    const color  = this.get('color');

    const nodes = this.get('nodes');

    selection.selectAll("circle")
        .data(nodes)
      .enter()
        .append("circle")
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d, i) { return color(i % 3); });

    var force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .friction(0.9)
        .nodes(nodes)
        .size([width, height]);

    var root = nodes[0];
    root.radius = 0;
    root.fixed = true;

    force.start();


    force.on("tick", function(e) {

      var q =d3.geom.quadtree(nodes);

      nodes.forEach( node => {
        q.visit(collide(node));
        let xerr = node.x - node.true_x;
        let yerr = node.y - node.true_y;
        node.x -= xerr*0.02;
        node.y -= yerr*0.01;
      })

      selection.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

    function collide(node) {
      var r = node.radius + 16,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
              y = node.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + quad.point.radius;
          if (l < r) {
            l = (l - r) / l * .5;
            node.x -= x *= l;
            node.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      };
    }

  }

});
