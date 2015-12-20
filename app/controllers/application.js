import Ember from 'ember';

export default Ember.Controller.extend({
  inventoryData() {
    return [
    {
      id: 1,
      xValue: 10,
      price: 100
    },
    {
      id: 2,
      xValue: 20,
      price: 200
    },
    {
      id: 3,
      xValue: 30,
      price: 300
    },
    {
      id: 4,
      xValue: 40,
      price: 400
    },
    {
      id: 5,
      xValue: 50,
      price: 500
    }];
  }
});
