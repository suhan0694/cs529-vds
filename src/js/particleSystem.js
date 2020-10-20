/* author: Andrew Burks */
'use strict'
import * as THREE from '../../vendor/three/build/three.module.js'
import legend from '../../lib/js/legend.js'

/* Get or create the application global variable */
var App = App || {}

const ParticleSystem = function () {
    // setup the pointer to the scope 'this' variable
    const self = this

    // data container
    const data = []

    // scene graph group for the particle system
    const sceneObject = new THREE.Group()

    // bounds of the data
    const bounds = {}

    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom

    const particleColors = d3
        .scaleSequential(d3.interpolateRgb('maroon', 'midnightblue'))
        //.domain(d3.extent(data.map(d => d.concentration)));
        .domain([0, 30].reverse())

    let plane
    let particles
    let particleSystem

    let xExtent
    let yExtent

    let xAxis
    let yAxis

    let svg

    // create the containment box.
    // This cylinder is only to guide development.
    // TODO: Remove after the data has been rendered
    self.drawContainment = function () {
        // get the radius and height based on the data bounds
        const radius = (bounds.maxX - bounds.minX) / 2.0 + 1
        const height = bounds.maxY - bounds.minY + 1

        // create a cylinder to contain the particle system
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
        })
        const cylinder = new THREE.Mesh(geometry, material)

        // add the containment to the scene
        sceneObject.add(cylinder)
    }

    self.drawRectanglePlane = function () {
        const slider = document.getElementById('zSlider')
        const valueOutput = document.getElementById('zValue')
        const sliderRange = d3.scaleLinear().domain([1, 100]).range([-5, 5])

        slider.onchange = function () {
            const value = sliderRange(this.value).toFixed(2)
            valueOutput.innerHTML = value
            plane.position.z = value
            self.drawD3Map(parseInt(value))
            self.updateForBrush(parseInt(value))
        }

        const width = bounds.maxX - bounds.minX + 1
        const height = bounds.maxY - bounds.minY + 1
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
        })
        const geometry = new THREE.PlaneGeometry(width, height, 2)
        plane = new THREE.Mesh(geometry, material)
        plane.translateY(5)
        sceneObject.add(plane)
    }

    // creates the particle system
    self.createParticleSystem = function () {
        const data1 = data.map((d) => d.z)
        console.log(d3.extent(data1))

        // use self.data to create the particle system
        // draw your particle system here!
        const sprite = new THREE.TextureLoader().load(
            '../../textures/sprites/disc.png'
        )

        particles = new THREE.Geometry()
        const pMaterial = new THREE.PointsMaterial({
            vertexColors: THREE.VertexColors,
            blending: THREE.AdditiveBlending,
            map: sprite,
            transparent: true,
            depthWrite: false,
            size: 0.1,
        })
        let particlePos

        for (const particle of data) {
            particlePos = new THREE.Vector3(particle.X, particle.Z, particle.Y)
            particles.vertices.push(particlePos)
            let particleColor = new THREE.Color(
                particleColors(particle.concentration)
            )
            particles.colors.push(particleColor)
        }

        particleSystem = new THREE.Points(particles, pMaterial)

        sceneObject.add(particleSystem)
    }

    // data loading function
    self.loadData = async function (file) {
        // read the csv file
        const loadedFile = await d3.csv(file)

        loadedFile.forEach((d) => {
            bounds.minX = Math.min(bounds.minX || Infinity, d.Points0)
            bounds.minY = Math.min(bounds.minY || Infinity, d.Points1)
            bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points2)

            // get the max bounds
            bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0)
            bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points1)
            bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points2)

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
                W: Number(d.velocity2),
            })
        })

        xExtent = d3.extent(data.map((d) => d.X))
        yExtent = d3.extent(data.map((d) => d.Z))

        self.createParticleSystem()

        self.drawRectanglePlane()

        self.drawAxis()
    }

    self.drawD3Map = function (zValue) {
        const d3Data = data.filter(
            (d) => d.Y <= zValue + 0.01 && d.Y >= zValue - 0.01
        )
        console.log(d3Data)

        d3.select('#scatterPlot').remove()

        svg.append('g')
            .attr('id', 'scatterPlot')
            .selectAll('dot')
            .data(d3Data)
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return xAxis(d.X)
            })
            .attr('cy', function (d) {
                return yAxis(d.Z)
            })
            .attr('r', 4)
            .style('fill', (d) => particleColors(d.concentration))
    }

    self.updateForBrush = function (zValue) {
        particleSystem.geometry.colorsNeedUpdate = true
        for (let i = 0; i < data.length; i++) {
            if (data[i].Y <= zValue + 0.05 && data[i].Y >= zValue - 0.05)
                particleSystem.geometry.colors[i].set(
                    particleColors(data[i].concentration)
                )
            else
                particleSystem.geometry.colors[i].set(
                    d3.scaleSequential(d3.interpolateGreys).domain([0, 30])(
                        data[i].concentration
                    )
                )
        }
    }

    self.drawAxis = function () {
        svg = d3
            .select('#d3_scatter')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        xAxis = d3.scaleLinear().domain(xExtent).range([0, width])

        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(xAxis))

        // Add Y axis
        yAxis = d3.scaleLinear().domain(yExtent).range([height, 0])
        svg.append('g').call(d3.axisLeft(yAxis))

        const d3_legend = document.getElementById('d3_legend')
        d3_legend.append(
            legend({
                color: d3.scaleSequential(
                    [0, 300],
                    d3.interpolateRgb('maroon', 'midnightblue')
                ),
                title: 'Concentration',
            })
        )
    }

    // publicly available functions
    self.public = {
        // load the data and setup the system
        initialize: function (file) {
            self.loadData(file)
        },

        // accessor for the particle system
        getParticleSystems: function () {
            return sceneObject
        },
    }

    return self.public
}

export default ParticleSystem
