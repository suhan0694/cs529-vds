/* author: Andrew Burks */
"use strict";
import * as THREE from '../../vendor/three/build/three.module.js';

/* Get or create the application global variable */
var App = App || {};

const ParticleSystem = function() {

    // setup the pointer to the scope 'this' variable
    const self = this;

    // data container
    const data = [];

    // scene graph group for the particle system
    const sceneObject = new THREE.Group();

    // bounds of the data
    const bounds = {};

    // create the containment box.
    // This cylinder is only to guide development.
    // TODO: Remove after the data has been rendered
    self.drawContainment = function() {

        // get the radius and height based on the data bounds
        const radius = (bounds.maxX - bounds.minX)/2.0 + 1;
        const height = (bounds.maxY - bounds.minY) + 1;

        // create a cylinder to contain the particle system
        const geometry = new THREE.CylinderGeometry( radius, radius, height, 32 );
        const material = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: true} );
        const cylinder = new THREE.Mesh( geometry, material );

        // add the containment to the scene
        sceneObject.add(cylinder);
    };

    self.drawRectanglePlane = function(){
        const width = (bounds.maxX - bounds.minX) + 1;
        const height = (bounds.maxY - bounds.minY) + 1;
        const material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5} );
        const geometry = new THREE.PlaneGeometry(width,height,2);
        const plane = new THREE.Mesh(geometry, material);
        sceneObject.add(plane);
    }

    // creates the particle system
    self.createParticleSystem = function() {

        // use self.data to create the particle system
        // draw your particle system here!
        const sprite = new THREE.TextureLoader().load( '../../textures/sprites/disc.png' );

        const particleColors = d3.scaleSequential(d3.interpolateRdBu)
        //.domain(d3.extent(data.map(d => d.concentration)));
        .domain([0,30].reverse());

        console.log(particleColors(250));

        const particles = new THREE.Geometry();
        const pMaterial = new THREE.PointsMaterial({
            vertexColors: THREE.VertexColors,
            blending: THREE.AdditiveBlending,
            map: sprite,
            transparent: true,
            depthWrite: false,
            size: 0.1
        });
        let particlePos;

        for (const particle of data){
            particlePos = new THREE.Vector3(particle.X, particle.Y, particle.Z)
            particles.vertices.push(particlePos)
            let particleColor = new THREE.Color(particleColors(particle.concentration))
            particles.colors.push(particleColor)
        }

        const particleSystem = new THREE.Points(particles, pMaterial);

        sceneObject.add(particleSystem)

    };

    // data loading function
    self.loadData = async function(file){

        // read the csv file
        const loadedFile = await d3.csv(file);

        loadedFile.forEach(d => { 
            bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
            bounds.minY = Math.min(bounds.minY || Infinity, d.Points1);
            bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points2);

            // get the max bounds
            bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
            bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points1);
            bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points2);

            // add the element to the data collection
            data.push({
                // concentration density
                concentration: Number(d.concentration),
                // Position
                X: Number(d.Points0),
                Y: Number(d.Points1),
                Z: Number(d.Points2),
                // Velocity
                U: Number(d.velocity0),
                V: Number(d.velocity1),
                W: Number(d.velocity2)
            });
        })

        self.createParticleSystem();

        self.drawRectanglePlane();
    };

    // publicly available functions
    self.public = {

        // load the data and setup the system
        initialize: function(file){
            self.loadData(file);
        },

        // accessor for the particle system
        getParticleSystems : function() {
            return sceneObject;
        }
    };

    return self.public;

};

export default ParticleSystem;