import { Map, NavigationControl } from 'mapbox-gl'
import { lineString, lineDistance, point, along } from '@turf/turf'

window.onload = () => {

    // Instellingen mapbox
    const accessToken = 'pk.eyJ1IjoicmVib3QiLCJhIjoiY2sxMTE2bzNjMDA1ODNlcDU5NHQ3c29oMiJ9.VfDPJP1o62zvc8GzywbRbg'

    // Maak de map aan
    const map = new Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2, 50],
        zoom: 9,
        hash: false,
        interactive: false,
        accessToken
    })

    // Voeg zoom en rotatie knoppen toe
    map.addControl(new NavigationControl())

    const preventDefault = e => {
        // Voorkom event listeners van parent elements
        e.stopPropagation()
        e.preventDefault()
    }

    const kaart = document.getElementById('map')

    kaart.addEventListener('dragover', (e) => {
        preventDefault(e)
    })

    kaart.addEventListener('dragenter', (e) => {
        preventDefault(e)
    })

    kaart.addEventListener('drop', (e) => {
        preventDefault(e)

        let dt = e.dataTransfer
        let files = dt.files

        for (let file of files){
            file.text().then(text => {
                const parser = new DOMParser()
                const doc = parser.parseFromString(text, 'application/xml')
                // Haal alle segmenten op
                const segments = Array.from(doc.getElementsByTagName('trkseg'))
                for (let segment of segments){
                    const points = Array.from(segment.getElementsByTagName('trkpt'))
                    // Zet punten op de kaart
                    const pointsSubset = points.filter((e, i) => {
                        return (i % 2 == 0)
                    })
                    // Ga verder met de subset
                    const latlngs = []
                    for (let point of pointsSubset){
                        if ('lat' in point.attributes && 'lon' in point.attributes){
                            const lat = point.getAttribute('lat')
                            const lon = point.getAttribute('lon')
                            latlngs.push([lon, lat])
                        }
                    }
                    // Algemeen
                    const options = {units: 'kilometers'}
                    // Maak een GeoJson aan
                    const route = lineString(latlngs, {
                        width: 2,
                        color: '#C62828'
                    })
                    const routeLengte = lineDistance(route, options)
                    // Maak de huidige marker aan
                    const huidigeLocatie = along(route, 0, options)
                    // Voeg route toe als bron
                    map.addSource('route', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [
                                route
                            ]
                        }
                    })
                    map.addSource('point', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [
                                huidigeLocatie
                            ]
                        }
                    })
                    // Toon de route 
                    map.addLayer({
                        'id': 'route',
                        'type': 'line',
                        'source': 'route',
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': ['get', 'color'],
                            'line-width': ['get', 'width']
                        }
                    })
                    map.addLayer({
                        'id': 'point',
                        'source': 'point',
                        'type': 'symbol',
                        'layout': {
                            'icon-image': 'bicycle-15'
                        }
                    })
                    console.log(route)
                    // Vlieg naar de start van de route
                    map.jumpTo({
                        center: huidigeLocatie.geometry.coordinates,
                        essential: true
                    })
                    
                    let i = 0
                    let timer = window.setInterval(() => {
                        if (i < routeLengte) {
                            const nieuweLocatie = along(route, i, options)
                            map.getSource('point').setData(nieuweLocatie)
                            map.panTo(nieuweLocatie.geometry.coordinates)
                            i += 0.1
                        } else {
                            window.clearInterval(timer)
                        }
                    }, 10)
                }
            })

            console.log(`Name: ${file.name} - ${file.size}`)
        }
    })

/*     window.onscroll = () => {

    } */

}