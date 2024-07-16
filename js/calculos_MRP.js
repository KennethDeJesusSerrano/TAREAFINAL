
let treeData = [];
let relationships = [];
let quantities = {};

function addNode() {
    const nodeName = document.getElementById("nodeName").value.trim();
    const parentNode = document.getElementById("parentNode").value.trim();
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!nodeName || isNaN(quantity) || quantity < 1) {
        mostrarAdvertencia("Por favor, ingrese un nombre para el nodo y una cantidad válida.");
        return;
    }

    const newNode = { name: nodeName, children: [] };
    quantities[nodeName] = quantity;

    if (parentNode) {
        let found = false;
        function searchNode(data) {
            data.forEach(node => {
                if (node.name === parentNode) {
                    node.children.push(newNode);
                    relationships.push({ source: parentNode, target: nodeName, quantity: quantity });
                    found = true;
                    return;
                }
                if (node.children.length) searchNode(node.children);
            });
        }
        searchNode(treeData);
        if (!found) {
            mostrarAdvertencia("Nodo padre no encontrado.");
            return;
        }
    } else {
        treeData.push(newNode);
    }

    document.getElementById("nodeName").value = "";
    document.getElementById("parentNode").value = "";
    document.getElementById("quantity").value = 1;
    mostrarExito("Nodo añadido correctamente.");
}

function generateTreeDiagram() {
    if (treeData.length === 0) {
        mostrarAdvertencia("No hay nodos para generar el diagrama.");
        return;
    }

    d3.select("#treeDiagram").html(""); 

    var margin = { top: 20, right: 120, bottom: 30, left: 120 },
        width = 1200 - margin.right - margin.left,
        height = 600 - margin.top - margin.bottom;

    var svg = d3.select("#treeDiagram").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var root = d3.hierarchy(treeData[0]);
    var treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    var links = svg.selectAll(".link")
        .data(root.links())
        .enter().append("g")
        .attr("class", "link");

    links.append("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    links.append("text")
        .attr("x", d => (d.source.y + d.target.y) / 2)
        .attr("y", d => (d.source.x + d.target.x) / 2)
        .attr("dy", "0.35em")
        .text(d => {
            const rel = relationships.find(r => r.source === d.source.data.name && r.target === d.target.data.name);
            return rel ? `${rel.quantity}` : '';
        });

    var node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("rect")
        .attr("width", 100)
        .attr("height", 30)
        .attr("x", -50) 
        .attr("y", -15) 
        .attr("fill", "#fff")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3);

    node.append("text")
        .attr("dy", "0.35em") 
        .attr("x", 0) 
        .attr("y", 0) 
        .style("text-anchor", "middle") 
        .text(d => `${d.data.name} (${quantities[d.data.name]})`);
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const diagram = document.getElementById('treeDiagram');

    html2canvas(diagram).then(canvas => {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('diagrama.pdf');
    }).catch(err => {
        console.error('Error al capturar el diagrama:', err);
    });
}

function calculateMRP() {
    if (treeData.length === 0) {
        mostrarAdvertencia("No hay nodos para calcular MRP.");
        return;
    }

    let mrpResults = {};

    function calculateNodeMRP(node, multiplier) {
        const nodeName = node.name;
        const nodeQuantity = quantities[nodeName] * multiplier;

        if (!mrpResults[nodeName]) {
            mrpResults[nodeName] = 0;
        }
        mrpResults[nodeName] += nodeQuantity;

        if (node.children && node.children.length > 0) {
            node.children.forEach(childNode => {
                const childRel = relationships.find(r => r.source === nodeName && r.target === childNode.name);
                if (childRel) {
                    calculateNodeMRP(childNode, nodeQuantity);
                }
            });
        }
    }

    treeData.forEach(rootNode => {
        calculateNodeMRP(rootNode, 1);
    });

    displayMRPResults(mrpResults);
}

function displayMRPResults(mrpResults) {
    const resultsDiv = document.getElementById('mrpResults');
    resultsDiv.innerHTML = "";
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    thead.innerHTML = `
        <tr>
            <th colspan="2">Resultados del MRP</th>
        </tr>
        <tr>
            <th>Material</th>
            <th>Cantidad Total</th>
        </tr>
    `;

    for (const [material, quantity] of Object.entries(mrpResults)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${material}</td>
            <td>${quantity}</td>
        `;
        tbody.appendChild(row);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    resultsDiv.appendChild(table);
}

function soloNumeros(event) {
    const input = event.target;
    const value = input.value;

   
    const validPattern = /^(\d*\.?\d*)$/;

    if (!validPattern.test(value) || parseFloat(value) < 0) {
        mostrarAdvertencia('Por favor, ingrese solo números positivos.');
        input.value = value.slice(0, -1); 
    }
}
function soloLetras(event) {
    const input = event.target;
    const value = input.value;
    
    const validPattern = /^[a-zA-Z]*$/;

    if (!validPattern.test(value)) {
        mostrarAdvertencia('Por favor, ingrese solo letras.');
        input.value = value.slice(0, -1); 
    }
}
function mostrarAdvertencia(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
    });
}
function mostrarExito(message) {
    Swal.fire({
        icon: 'success',
        title: 'Buen trabajo!',
        text: message,
        confirmButtonText: 'Listo!',
    });
}
function mostrarEliminacionExito() {
    Swal.fire({
        icon: 'success',
        title: 'Registro Eliminado',
        text: 'El registro ha sido eliminado exitosamente.',
        confirmButtonText: 'OK'
    });
}