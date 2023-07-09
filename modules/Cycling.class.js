import { Workout } from './Workout.class.js';

export class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration;
  }
}
