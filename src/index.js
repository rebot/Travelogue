import {Map, NavigationControl} from 'mapbox-gl'
import {lineString, lineDistance, point, along} from '@turf/turf'
import MapboxGLButtonControl from './buttoncontrol'

let last_known_scroll_position = 0;
let end

function create_fake_scroll() {
    let fakeScroll = document.createElement('div')
    fakeScroll.className = 'fake-scroll'
    document.body.appendChild(fakeScroll)
    return fakeScroll
}

// fakescroll is an element to make the page scrollable
let fakeScroll = create_fake_scroll()
let autoScroll = false

const ctrlPlayPause = new MapboxGLButtonControl({
    className: "mapbox-gl-play_pauze",
    title: "PlayPause",
    eventHandler: playPause
});

function playPause(event) {
    autoScroll = !autoScroll;
    console.log(autoScroll)
    autoScrollFunc()

}

function autoScrollFunc() {
    console.log(last_known_scroll_position)
    console.log(end)
    if (last_known_scroll_position >= end) {
        autoScroll = false
    }
    window.scrollBy(0, 20);
    setTimeout(() => {
        if (autoScroll) {
            autoScrollFunc()
        }
    }, 10)
}


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

        for (let file of files) {
            file.text().then(text => {
                const parser = new DOMParser()
                const doc = parser.parseFromString(text, 'application/xml')
                // Haal alle segmenten op
                const segments = Array.from(doc.getElementsByTagName('trkseg'))
                for (let segment of segments) {
                    const points = Array.from(segment.getElementsByTagName('trkpt'))
                    // Zet punten op de kaart
                    const pointsSubset = points.filter((e, i) => {
                        return (i % 2 == 0)
                    })
                    // Ga verder met de subset
                    const latlngs = []
                    for (let point of pointsSubset) {
                        if ('lat' in point.attributes && 'lon' in point.attributes) {
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
                    // set the fake scroll height div
                    fakeScroll.style.height = ((routeLengte * 1000) + window.innerWidth) + 'px'
                    //set the endpoint
                    end = ((routeLengte * 1000))
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
                            'icon-size': 2,
                            'icon-image': 'bicycle-15',
                            'symbol-z-order': 'auto',
                            'text-allow-overlap': false
                        }
                    })
                    map.addControl(ctrlPlayPause, "bottom-left")
                    console.log(route)
                    // Vlieg naar de start van de route
                    map.jumpTo({
                        center: huidigeLocatie.geometry.coordinates,
                        essential: true
                    })

                    window.onscroll = () => {
                        last_known_scroll_position = window.scrollY
                        const nieuweLocatie = along(route, last_known_scroll_position / 1000, options)
                        map.getSource('point').setData(nieuweLocatie)
                        map.panTo(nieuweLocatie.geometry.coordinates)
                    }
                }
            })
            console.log(`Name: ${file.name} - ${file.size}`)
        }
    })
}