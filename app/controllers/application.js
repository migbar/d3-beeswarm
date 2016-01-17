import Ember from 'ember';
const { computed } = Ember;

export default Ember.Controller.extend({
  allVehicles: computed.alias('model'),
  A: true,
  B: true,
  C: true,
  CLK: true,
  ML: true,
  GLC: true,
  GL: true,
  GLK: true,

  modelClasses: 'A B C CLK ML GLC GL GLK CLS CL S SL SLK SLS'.w(),
  modelClassSelections: computed('modelClasses', function(clazz, index) {
    return this.get(clazz);
  }),
  selectedVehicles: computed('allVehicles', 'A', 'B', 'C', 'CLK', 'ML', 'GLC', 'GL', 'GLK', function() {
    return this.get('allVehicles').filter( v => {return this.get(v.modelClass); });
  }),

  actions: {
    refresh() {
      console.log('in refresh');
    },

    remove() {
      console.log('in remove');
    },

    toggleClassSelection() {
      console.log('in toggle class');
    }
  }
});
