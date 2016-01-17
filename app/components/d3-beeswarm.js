import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';

const { get } = Ember;

import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

  /**
    1 - pull data in
    2 - axis
    3 - mouseover popup
    4 - decorations based on data (border, color, P1)
    5 - user filtering of nodes
  **/
export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  layout: hbs`{{yield currentVehicle}}`,
  currentVehicle: null, //set on hover for the tooltip yield
  xPadding: 50,
  vehicles: Ember.computed.alias('model'),

  xScale: Ember.computed('contentWidth', 'vehicles', function() {
    const width = this.get('contentWidth');
    const timeDomain = d3.extent(this.get('vehicles'), vehicle => vehicle.date);
    const timeScale = d3.time.scale();
    return timeScale.domain(timeDomain).range([ this.get('xPadding'), (width - this.get('xPadding')) ]);
  }),

  nodes: Ember.computed('contentWidth', 'contentHeight', function() {
    const comp = this;
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight') / 2;

    return this.get('vehicles').map(function(veh) {
      const true_x = comp.get('xScale')(veh.date);
      const radius = veh.price/10000 + 3;
      return { vehicle: veh, x: true_x, true_x: true_x, true_y: height, radius: radius };
      });
  }),

  copy(obj) {
    if (obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  },

  call(selection) {
    this.setupCircles(selection);
    this.setupAxis(selection);
    this.setupForce(selection);
  },

  setupAxis(selection) {
    // debugger;
    selection.selectAll(".x.axis").remove();

    // console.log('in setup axis');
    const xAxis = d3.svg.axis().scale(this.get('xScale')).orient(" bottom").ticks(15);
    const axisYPosition = this.get('height') / 1.5;
    // console.log('axisYPosition', axisYPosition);
    selection
      .append('g')
      .classed('x axis', true)
      .call(xAxis);

    d3.select('.x.axis')
      .attr('transform', `translate(0 ${ axisYPosition })`);
  },

  showPopup(d, elem, selection) {
    // set vehicle for tooltip
    this.set('currentVehicle', d.vehicle);

    // set stroke for the element being hovered
    d3.select(elem)
      .style('stroke-width', '2')
      .style('stroke', '#000');

    // Update the tooltip position and make it visible
    d3.select("#tooltip")
      .style("left", d3.event.x + "px")
      .style("top",  d3.event.y + "px")
      .classed("hidden", false);
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
        .style("fill", function(d, i) { return color(d.vehicle.modelClass); })
        .classed("circle", true);

      d3.selectAll('.circle')
        .on('mouseover', function(d) { comp.showPopup(d, this, selection); })
        .on('mouseout',  function(d) { comp.hidePopup(d, this, selection); });
  },

  hidePopup(d, elem, selection) {
    // hide the tooltip
    d3.select("#tooltip")
      .classed("hidden", true);

    // remove the stroke for the element
    d3.select(elem)
      .style('stroke-width', '0');
  },

  setupForce(selection) {
    const comp = this;
    const nodes = this.get('nodes');
    const width  = this.get('contentWidth');
    const height = this.get('contentHeight');

    const force = d3.layout.force()
        .gravity(0.01)
        .charge(0.01)
        .friction(0.9)
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
