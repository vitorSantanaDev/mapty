'use strict';

import { Running } from './modules/Running.class.js';
import { Cycling } from './modules/Cycling.class.js';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    this.#getPosition();
    this.#getLocalStorageData();

    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationFields);
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this.#showForm.bind(this));

    this.#workouts.forEach(work => {
      this.#renderWorkoutMarker(work);
    });
  }

  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your current location');
        }
      );
    }
  }

  #showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  #toggleElevationFields() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(event) {
    event.preventDefault();

    function validInputs(...inputs) {
      return inputs.every(i => Number.isFinite(i));
    }

    function allPositive(...inputs) {
      return inputs.every(i => i > 0);
    }

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }

    this.#renderWorkoutMarker(workout);
    this.#renderWorkout(workout);
    this.#hideForm();
    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = /*html*/ `
		<li class="workout workout--${workout.type}" data-id="${workout.id}">
			<h2 class="workout__title">${workout.description}</h2>
			<div class="workout__details">
				<span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
				<span class="workout__value">${workout.distance}</span>
				<span class="workout__unit">km</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">⏱</span>
				<span class="workout__value">${workout.duration}</span>
				<span class="workout__unit">min</span>
			</div>
		`;

    if (workout.type === 'running') {
      html += /*html*/ `
			<div class="workout__details">
				<span class="workout__icon">⚡️</span>
				<span class="workout__value">${workout.pace.toFixed(1)}</span>
				<span class="workout__unit">min/km</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">🦶🏼</span>
				<span class="workout__value">${workout.cadence}</span>
				<span class="workout__unit">spm</span>
			</div>
		</li>
			`;
    }

    if (workout.type === 'cycling') {
      html += /*html*/ `
			<div class="workout__details">
				<span class="workout__icon">⚡️</span>
				<span class="workout__value">${workout.speed.toFixed(1)}</span>
				<span class="workout__unit">km/h</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">⛰</span>
				<span class="workout__value">${workout.elevationGain}</span>
				<span class="workout__unit">m</span>
			</div>
		</li>
			`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  #generatingNewWorkoutObjectWithCorrectPrototype(workout) {
    let newWorkout;

    const theWorkoutAlreadyHasTheCorrectRunningPrototype =
      workout.type === 'running' && Running.prototype.isPrototypeOf(workout);

    const theWorkoutAlreadyHasTheCorrectCyclingPrototype =
      workout.type === 'cycling' && Cycling.prototype.isPrototypeOf(workout);

    if (
      theWorkoutAlreadyHasTheCorrectRunningPrototype ||
      theWorkoutAlreadyHasTheCorrectCyclingPrototype
    ) {
      return workout;
    }

    if (workout.type === 'running') {
      newWorkout = new Running(
        workout.coords,
        workout.distance,
        workout.duration,
        workout.cadence
      );
    }

    if (workout.type === 'cycling') {
      newWorkout = new Cycling(
        workout.coords,
        workout.distance,
        workout.duration,
        workout.elevationGain
      );
    }

    delete newWorkout.id;
    delete newWorkout.date;
    delete newWorkout.clicks;

    newWorkout.id = workout.id;
    newWorkout.date = workout.date;
    newWorkout.clicks = workout.clicks;

    return newWorkout;
  }

  #moveToPopup(event) {
    const workoutElement = event.target.closest('.workout');

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      work => work.id === workoutElement.dataset.id
    );

    const workoutWithCorrectPrototype =
      this.#generatingNewWorkoutObjectWithCorrectPrototype(workout);

    this.#map.setView(workoutWithCorrectPrototype.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });

    workoutWithCorrectPrototype.click();

    this.#workouts = this.#workouts.filter(work => work.id !== workout.id);

    this.#workouts.push(workoutWithCorrectPrototype);

    this.#setLocalStorage(this.#workouts);
  }
}

new App();
