import {
    lineString,
    lineDistance,
    point,
    along
} from '@turf/turf'

/**
 * Config: configurable options for:
 * - Mapbox
 * - Truf
 */
const config = {
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

module.exports = {
    transformGPXToGeoJSON,
    buildGeoJSONFeatureCollection,
    buildLineFeature,
    buildPointFeature
}