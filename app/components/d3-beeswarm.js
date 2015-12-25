import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';

const { get } = Ember;

import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  /**
    1 - pull data in
    2 - axis
    3 - mouseover popup
    4 - decorations based on data (border, color, P1)
    5 - user filtering of nodes
  **/
  layout: hbs`{{yield currentModelClass currentPrice}}`,

  vehicles: Ember.computed.alias('model'),

  currentModelClass: null,
  currentPrice: null,

  xScale: Ember.computed('contentWidth', 'vehicles', function() {
    const width = this.get('contentWidth');
    const timeDomain = d3.extent(this.get('vehicles'), vehicle => vehicle.date);
    const timeScale = d3.time.scale();
    return timeScale.domain(timeDomain).range([ 0, width ]);
  }),

  nodes: Ember.computed('contentWidth', 'contentHeight', function() {
    const comp = this;
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    return this.get('vehicles').map(function(veh) {
      const true_x = comp.get('xScale')(veh.date);
      return {
        radius: Math.random() * 12 + 4,
        x: true_x,
        true_y: height / 2,
        color: veh.color,
        modelClass: veh.modelClass,
        date: veh.date,
        price: veh.price,
        true_x: true_x };
      });
  }),

  copy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  call(selection) {
    this.setupCircles(selection);
    this.setupAxis(selection);
    this.setupForce(selection);
  },

  setupAxis(selection) {
    const xAxis = d3.svg.axis().scale(this.get('xScale')).orient(" bottom").ticks(15);
    const axisYPosition = this.get('height') / 1.5;
    selection
      .append('g')
      .classed('x-axis', true)
      .call(xAxis);

    d3.select('.x-axis')
      .attr('transform', `translate(0 ${ axisYPosition })`);
  },

  popup(d, elem, selection) {
    // Get this bar's x/ y values, then augment for the tooltip
    var xPosition = parseFloat(d3.select(elem).attr("cx")); // + this.get('xScale').range() / 2;
    var yPosition = parseFloat(d3.select(elem).attr("cy")); // + this.get('contentHeight') / 2;
    // Update the tooltip position and value

    d3.select("#tooltip")
      .style("left", xPosition + "px")
      .style("top",  yPosition + "px")
      .select("#modelClass")
      .text(d.modelClass);

    d3.select("#price")
      .text(d.price);

      // Show the tooltip
      d3.select("#tooltip")
        .classed("hidden", false);





    // this.set('currentModelClass', d.modelClass);
    // this.set('currentPrice', d.price);

    // const xPosition = parseFloat(d3.select(elem).attr("cx")); // + this.get('xScale').rangeBand() / 2;
    // const yPosition = parseFloat(d3.select(elem).attr("cy")); // + 14;

    // selection
    //   .append("text")
    //   .attr("id", "tooltip")
    //   .attr("x", xPosition)
    //   .attr("y", yPosition)
    //   .attr("text-anchor", "middle")
    //   .attr("font-family", "sans-serif")
    //   .attr("font-size", "11px")
    //   .attr("font-weight", "bold")
    //   .attr("fill", "black")
    //   .text( d.modelClass );

  },

  setupCircles(selection) {
    const comp = this;
    const color  = this.get('color');
    const nodes = this.get('nodes');

    nodes.unshift(this.copy(nodes[0]));

    selection
        .selectAll("circle")
        .data(nodes.slice(1))
      .enter()
        .append("circle")
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d, i) { return color(d.modelClass); })
        .classed("circle", true);

      d3.selectAll('.circle')
        .on('mouseover', function(d) {
          comp.popup(d, this, selection);
        })
        .on('mouseout', function(d) {
          // d3.select("#tooltip").remove();
          d3.select("#tooltip")
            .classed("hidden", true);
        });

  },

  setupForce(selection) {
    const comp = this;
    const nodes = this.get('nodes');
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    const force = d3.layout.force()
        .gravity(0.01)
        .charge(0.01)
        .friction(0.96)
        .nodes(nodes)
        .size([width, height]);

    force.start();

    force.on("tick", function() {

      const q =d3.geom.quadtree(nodes);

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
    const r = node.radius + 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        let x = node.x - quad.point.x;
        let y = node.y - quad.point.y;
        let l = Math.sqrt(x * x + y * y);
        const  r = node.radius + quad.point.radius;
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
