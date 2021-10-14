import {
    transformGPXToGeoJSON,
    buildGeoJSONFeatureCollection,
    buildLineFeature,
    buildPointFeature
} from './geojson'

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
            if (doc) {
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

module.exports = {
    readGPXFile,
    renderGPXFile
}
