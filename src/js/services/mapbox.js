import {
  mapbox as mapboxConfig
} from './../config'
import {
  Map,
  NavigationControl
} from 'mapbox-gl'
import {
  lineString,
  lineDistance,
  point,
  along
} from '@turf/turf'
import MapboxGLButtonControl from '../components/mapbox/buttoncontrol'

/**
 * Config: configurable options for:
 * - Mapbox
 * - Truf
 */
const config = {
  mapbox: {
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [2, 50],
    zoom: 9,
    hash: false,
    interactive: false,
    accessToken: mapboxConfig.accessToken
  },
  turf: {
    units: 'kilometers'
  }
}

/**
 * Properties: configurable options for:
 * - Mapbox
 * - Turf
 */
const properties = {
  mapbox: {
    scroll: {
      element: undefined,
      autoScroll: false,
      scrollPosition: 0,
      height: undefined,
      speed: 3 // speed in km/s
    }
  },
  turf: {
    lineString: {
      width: 3,
      color: '#917421'
    },
    point: {
      'icon-size': 2,
      'icon-image': 'bicycle-15'
    }
  }
}

/**
 * Make and configure a Mapbox instance. Features:
 * - Outdoor map
 * - No interaction allowed
 * - URI not adapted on position change
 */
const map = new Map({
  container: 'map',
  ...config.mapbox
})

// Add a zoom controller to the map
map.addControl(new NavigationControl())

/**
 * Trigger this on a drop event on the map context
 *
 * @name mapDropListener
 * @param {event} e - The drop event
 */
const mapDropListener = async e => {
  preventDefault(e)

  const dt = e.dataTransfer
  const files = dt.files

  for (const file of files) {
    if (file.type == 'application/gpx+xml' || /\.[0-9a-z]+$/i.exec(file.name)[0].toLowerCase() == '.gpx') {
      const doc = await readGPXFile(file)
      if (doc != undefined) {
        renderGPXFile(doc)
      }
    }
  }
}

/**
 * Trigger autoScrolling on button click
 *
 * @name autoScrollButtonListener
 * @param {Event} e - Click Event
 */
let scrollAnimation = undefined
const autoScrollButtonListener = e => {
  e.stopPropagation()
  e.preventDefault()

  const autoScrollState = !properties.mapbox.scroll.autoScroll
  properties.mapbox.scroll.autoScroll = autoScrollState

  if (autoScrollState == true) {
    // Autoscrolling at 60 fps
    scrollAnimation = window.requestAnimationFrame(routeScrollAnimation)
  } else {
    // Cancel the animation when autoScrollState is false
    window.cancelAnimationFrame(scrollAnimation)
  }
}

/**
 * Read .gpx file
 *
 * @name readGPXFile
 * @param {File} f - File Object
 * @returns {Promise} - Promise
 */
const readGPXFile = f => {
  const reader = new FileReader()
  const content = reader.readAsText(f, 'utf-8')
  // When loading finishes - return XML document
  return new Promise((resolve, reject) => {
    reader.addEventListener('loadend', e => {
      const text = e.target.result
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'application/xml')
      if (doc){
        resolve(doc)
      } else {
        reject('Document is not a valid GPX File')
      }
    })
  })
}

const renderGPXFile = doc => {
  // Retrieve segments - normally only one
  const segments = Array.from(doc.getElementsByTagName('trkseg'))
  for (const segment of segments) {
    // Transform the segment to a GeoJSON LineString
    const route = transformGPXToGeoJSON(segment)
    const distance = lineDistance(route, config.turf)
    // Store the current position - first point of route
    const position = along(route, 0, config.turf)
    // Add the route (line feature) and current position (point feature) as a Mapbox Source
    map.addSource('route', buildGeoJSONFeatureCollection(route))
    map.addSource('position', buildGeoJSONFeatureCollection(position))
    // Add the sources to the map
    map.addLayer(buildLineFeature('route'))
    map.addLayer(buildPointFeature('position'))
    // Vlieg naar de start van de route
    map.jumpTo({
      center: position.geometry.coordinates,
      essential: true
    })
  }
  // Combined route
  const combinedRoute = transformGPXToGeoJSON(doc)
  // Add a window onScroll event handeler
  window.addEventListener('scroll', e => {
    properties.mapbox.scroll.position = window.scrollY
    const newPosition = along(combinedRoute, properties.mapbox.scroll.position / 100, config.turf)
    map.getSource('position').setData(newPosition)
    map.panTo(newPosition.geometry.coordinates)
  })
  // Configurate the height of the dummy scroll DOM Element
  properties.mapbox.scroll.height = lineDistance(combinedRoute, config.turf) * 100 + window.innerHeight
  properties.mapbox.scroll.element.style.height = (properties.mapbox.scroll.height) + 'px'
}

/**
 * Save
 *
 * @param {*} f
 */
const saveFile = f => {

}

/**
 * Transform GPX File to a GeoJson Line
 *
 * @name transformGPXToGeoJSON
 * @param {XMLDocument} doc - Full or subset of the original GPX File
 * @returns {LineString}
 */
const transformGPXToGeoJSON = doc => {
  // Get the points from the doc - this can be a subset of the original GPX File
  const trackPoints = Array.from(doc.getElementsByTagName('trkpt'))
  // Make an Array containing array of [lon, lat] coordinates
  const latlngs = []
  for (const trackPoint of trackPoints) {
    if ('lat' in trackPoint.attributes && 'lon' in trackPoint.attributes) {
      const lat = trackPoint.getAttribute('lat')
      const lon = trackPoint.getAttribute('lon')
      latlngs.push([lon, lat])
    }
  }
  // Tranform the points into a GeoJSON LineString
  return lineString(latlngs, properties.turf.lineString)
}

/**
 * Make a GeoJSON Feature collection
 *
 * @name buildGeoJSONFeatureCollection
 * @param {*} features
 * @returns {GeoJSONObject}
 */
const buildGeoJSONFeatureCollection = features => {
  // Make an array if it's not one
  if (!Array.isArray(features)) {
    features = new Array(features)
  }
  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features
    }
  }
}

/**
 * Build a Line Feature necessary to make a Mapbox Layer
 *
 * @name buildLineFeature
 * @param {String} id - Source name stored in Mapbox instance
 * @returns {Object} - LineFeature
 */
const buildLineFeature = id => {
  // Check if the source exists
  if (map.getSource(id) == undefined) {
    console.log(`The line source '${id}' is not defined within the Mapbox instance`)
    return undefined
  }
  return {
    id: id,
    type: 'line',
    source: id,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['get', 'width']
    }
  }
}

/**
 * Build a Point Feature necessary to make a Mapbox Layer
 *
 * @name buildPointFeature
 * @param {String} id - Source name stored in Mapbox instance
 * @returns {Object} - LineFeature
 */
const buildPointFeature = id => {
  // Check if the source exists
  if (map.getSource(id) == undefined) {
    console.log(`The point source '${id}' is not defined within the Mapbox instance`)
    return undefined
  }
  return {
    id: id,
    source: id,
    type: 'symbol',
    layout: {
      ...properties.turf.point,
      'symbol-z-order': 'source',
      'text-allow-overlap': false
    }
  }
}

/**
 *  Generate scroll animation frame
 *
 * @name routeScrollAnimation
 * @param {*} timestamp
 */
const routeScrollAnimation = (timestamp) => {
  // Amount of pixels that represents the speed
  let framePixelCount = 20
  if (properties.mapbox.scroll.speed != undefined) {
    framePixelCount = properties.mapbox.scroll.speed
  }
  // Scroll the page
  window.scrollBy(0, framePixelCount)
  // Generate the next frame if the end is not reached
  if (window.scrollY <= properties.mapbox.scroll.height && properties.mapbox.scroll.autoScroll) {
    window.requestAnimationFrame(routeScrollAnimation)
  }
}

/**
 * Create a dummy DOM Element to fix scrolling
 *
 * @name createScrollDummy
 * @returns {Element}
 */
const createScrollDummy = () => {
  const scrollDummyElement = document.createElement('div')
  scrollDummyElement.className = 'scroll-dummy'
  document.body.appendChild(scrollDummyElement)
  return scrollDummyElement
}

/**
 * Prevent events to trigger the default action and propagation
 *
 * @name preventDefault
 * @param {*} e - The event
 */
const preventDefault = e => {
  e.stopPropagation()
  e.preventDefault()
}

// Create the fake scroll element
properties.mapbox.scroll.element = createScrollDummy()

// Add event Listeners
const mapElement = document.getElementById('map')
mapElement.addEventListener('dragover', preventDefault)
mapElement.addEventListener('dragenter', preventDefault)
mapElement.addEventListener('drop', mapDropListener)

map.on('click', (e) => {
  console.log(e)
})

// Add a button to make scrolling available
map.addControl(
    new MapboxGLButtonControl({
      title: 'Enable auto-scroll',
      className: 'mapbox-gl-scroll-button',
      eventHandler: autoScrollButtonListener
    }),
    'bottom-left'
  )

module.exports = {
  map
}
