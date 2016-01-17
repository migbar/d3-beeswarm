import Ember from 'ember';

export default Ember.Route.extend({
  futureDate: function() {
    let month = this.randomInt(1, 12);
    let day = 1;
    if (month == 2) {
      day = this.randomInt(1,28);
    } else {
      day = this.randomInt(1,30);
    }
    return moment("2016-"+month+"-"+day);
  },

  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomColor() {
    return this.one('white blue black orange red green yellow'.w());
  },

  modelClasses: 'A B C CLK ML GLC GL GLK ML CLS CL S SL SLK SLS'.w(),
  randomModelClass() {
    // return this.one('A B C CLK ML GLC GL GLK'.w());
    return this.one(this.get('modelClasses'));
  },

  randomUpholstery() {
    return this.one('tan grey black'.w());
  },

  one: function(coll) {
    return coll.sort( function() { return 0.5 - Math.random(); } )[0];
  },

  model() {
    let numCars = 200;
    let res = [];

    for (var i = 0; i < numCars; i++) {
      let veh = {
        VIN: i,
        price: this.randomInt(35000, 125000),
        date: this.futureDate().toDate(),
        color: this.randomColor(),
        modelClass: this.randomModelClass(),
        upholstery: this.randomUpholstery(),
      }
      res.pushObject(veh);
    };
    return res;
  }
});
