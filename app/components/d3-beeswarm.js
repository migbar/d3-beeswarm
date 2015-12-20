import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';

const { get } = Ember;

import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  /**
    1 - pull data in
    2 - axix
    3 - mouseover popup
    4 - decorations based on data (border, color, P1)
    5 - user filtering of nodes
  **/
  layout: hbs`{{yield contentWidth contentHeight}}`,

  vehicles: Ember.computed.alias('model'),

  nodes: Ember.computed('contentWidth', 'contentHeight', function() {
    // return this.get('vehicles');
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    const timeDomain = d3.extent(this.get('vehicles'), vehicle => vehicle.date);
    const timeScale = d3.time.scale();
    const xScale = timeScale.domain(timeDomain).range([ 0, width ]);

    return this.get('vehicles').map(function(veh) {

      var true_x = xScale(veh.date);

      return {
        radius: Math.random() * 12 + 4,
        x: true_x,
        true_y: height / 2,
        true_x: true_x };
      });
  }),

  copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  call(selection) {
    this.setupCircles(selection);
    this.setupForce(selection);
  },

  setupCircles(selection) {
    const color  = this.get('color');
    const nodes = this.get('nodes');

    nodes.unshift(this.copy(nodes[0]));

    selection
        .selectAll("circle")
        .data(nodes.slice(1))
      .enter()
        .append("circle")
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d, i) { return color(i % 3); });
  },

  setupForce(selection) {
    const comp = this;
    const nodes = this.get('nodes');
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    var force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .friction(0.96)
        .nodes(nodes)
        .size([width, height]);

    force.start();

    force.on("tick", function() {

      var q =d3.geom.quadtree(nodes);

      nodes.forEach( node => {
        q.visit(comp.collide(node));
        let xerr = node.x - node.true_x;
        let yerr = node.y - node.true_y;
        node.x -= xerr*0.02;
        node.y -= yerr*0.01;
      });

      selection.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });
  },

  collide(node) {
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
          l = (l - r) / l * 0.5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }

});
