'use strict'
import Scene from './scene.js'
import ParticleSystem from './particleSystem.js'
/* Get or create the application global variable */
var App = App || {}

/* IIFE to initialize the main entry of the application*/

// setup the pointer to the scope 'this' variable
var self = this

/* Entry point of the application */
App.start = function () {
    // create a new scene, pass options as dictionary
    App.scene = new Scene({ container: 'scene' })

    // initialize the particle system
    const particleSystem = new ParticleSystem()
    particleSystem.initialize('data/058.csv')

    //add the particle system to the scene
    App.scene.addObject(particleSystem.getParticleSystems())

    // render the scene
    App.scene.render()
}

export default App
