let map, directionsService, directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 4,
        center: { lat: -14.235, lng: -51.925 },
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    document.querySelectorAll(".cidade-input").forEach(input => ativarAutocomplete(input));
}

function ativarAutocomplete(elemento) {
    new google.maps.places.Autocomplete(elemento, {
        types: ['(cities)'],
        componentRestrictions: { country: 'br' }
    });
}

function adicionarCampo() {
    const container = document.getElementById("container-cidades");
    const div = document.createElement("div");
    div.className = "input-row";
    div.innerHTML = `
        <input type="text" class="cidade-input" placeholder="Parada intermediária">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">-</button>
    `;
    container.insertBefore(div, container.lastElementChild);
    ativarAutocomplete(div.querySelector(".cidade-input"));
}

async function calcularTrajeto() {
    const inputs = document.querySelectorAll(".cidade-input");
    const cidades = Array.from(inputs).map(i => i.value).filter(v => v !== "");

    if (cidades.length < 2) return alert("Preencha ao menos origem e destino.");

    const URL_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://calculadora-rotas.onrender.com';

    try {
        const res = await fetch(`${URL_BASE}/api/distancia?origem=${cidades[0]}&destino=${cidades[cidades.length-1]}`);
        const data = await res.json();

        if (data.status === "OK") {
            const waypoints = cidades.slice(1, -1).map(c => ({ location: c, stopover: true }));
            directionsService.route({
                origin: cidades[0],
                destination: cidades[cidades.length - 1],
                waypoints: waypoints,
                travelMode: 'DRIVING'
            }, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result);
 
                    let dist = 0, tempo = 0;
                    result.routes[0].legs.forEach(leg => {
                        dist += leg.distance.value;
                        tempo += leg.duration.value;
                    });

                    document.getElementById("txtDistancia").innerText = (dist / 1000).toFixed(1) + " km";
                    const h = Math.floor(tempo / 3600);
                    const m = Math.floor((tempo % 3600) / 60);
                    document.getElementById("txtTempo").innerText = `${h}h ${m}min`;
                    document.getElementById("resultado").classList.remove("hidden");
                }
            });
        }
    } catch (e) { alert("Erro ao calcular. Verifique se o servidor backend está rodando."); }
}

window.onload = initMap;
