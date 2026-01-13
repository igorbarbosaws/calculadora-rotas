let map, directionsService, directionsRenderer;

function initMap() {
    // Inicializa o mapa centralizado no Brasil
    map = new google.maps.Map(document.getElementById("map-container"), {
        zoom: 4,
        center: { lat: -14.235, lng: -51.925 },
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Ativa o autocomplete nos campos que já existem
    document.querySelectorAll(".cidade-input").forEach(input => ativarAutocomplete(input));
}

function ativarAutocomplete(elemento) {
    // Configura o autocomplete apenas para cidades do Brasil
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
    
    // Ativa o autocomplete no novo campo criado
    ativarAutocomplete(div.querySelector(".cidade-input"));
}

async function calcularTrajeto() {
    const inputs = document.querySelectorAll(".cidade-input");
    const cidades = Array.from(inputs).map(i => i.value).filter(v => v !== "");

    if (cidades.length < 2) {
        alert("Por favor, preencha pelo menos a Origem e o Destino.");
        return;
    }

    // --- CONFIGURAÇÃO DA URL DO SERVIDOR (AQUI ESTAVA O ERRO) ---
    // Verifica se você está no computador (localhost) ou na internet
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const URL_BASE = isLocal
        ? 'http://localhost:3000' 
        : 'https://calculadora-rotas.onrender.com'; // Sua URL exata do Render sem barra no final

    console.log("Tentando conectar em:", URL_BASE); // Para debug no Console (F12)

    try {
        // Monta a URL completa
        const endpoint = `${URL_BASE}/api/distancia?origem=${encodeURIComponent(cidades[0])}&destino=${encodeURIComponent(cidades[cidades.length-1])}`;
        
        const response = await fetch(endpoint);

        // Tratamento específico para o erro 429 (Muitas requisições)
        if (response.status === 429) {
            throw new Error("Muitas solicitações seguidas. Aguarde alguns instantes e tente novamente.");
        }

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        const data = await response.json();

        // Se o servidor retornou OK, desenha a rota
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
                    
                    // Soma das distâncias e tempos
                    let dist = 0, tempo = 0;
                    result.routes[0].legs.forEach(leg => {
                        dist += leg.distance.value;
                        tempo += leg.duration.value;
                    });

                    // Exibe o resultado na tela
                    document.getElementById("txtDistancia").innerText = (dist / 1000).toFixed(1) + " km";
                    
                    const h = Math.floor(tempo / 3600);
                    const m = Math.floor((tempo % 3600) / 60);
                    document.getElementById("txtTempo").innerText = `${h}h ${m}min`;
                    
                    document.getElementById("resultado").classList.remove("hidden");
                } else {
                    alert("Não foi possível traçar a rota no mapa visual: " + status);
                }
            });
        } else {
            alert("Erro na API do Google: " + JSON.stringify(data));
        }

    } catch (error) {
        console.error("Erro detalhado:", error);
        alert("Falha ao calcular: " + error.message);
    }
}

// Garante que o mapa inicie assim que a janela carregar
window.onload = initMap;
