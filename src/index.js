import { map, LatLng } from 'leaflet'
import 'leaflet-draw'

window.onload = () => {

    const mapElement = document.getElementById('map')

    const map = L.map(mapElement).setView([51.505, -0.09], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    // Definieer een tekengroep
    const drawnItems = new L.FeatureGroup()
    drawnItems.addTo(map)
    // Definieer de tools
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: false,
            marker: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems
        }
    })
    drawControl.addTo(map)
    // Wanneer een nieuwe tekening is aangemaakt
    map.on('draw:created', (e) => {
        const { layerType, layer } = e
        // Voeg toe aan de kaart
        layer.addTo(map)
    })

    const preventDefault = e => {
        // Voorkom event listeners van parent elements
        e.stopPropagation()
        e.preventDefault()
    }

    mapElement.addEventListener('dragover', (e) => {
        preventDefault(e)
    })

    mapElement.addEventListener('dragenter', (e) => {
        preventDefault(e)
    })

    mapElement.addEventListener('drop', (e) => {
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
                            latlngs.push([lat, lon])
                        }
                    }
                    L.polyline(latlngs, {color: 'red'}).addTo(map)
                    const lat = points[0].getAttribute('lat')
                    const lon = points[0].getAttribute('lon')
                    map.flyTo([lat, lon])
                }
            })

            console.log(`Name: ${file.name} - ${file.size}`)
        }
    })

}