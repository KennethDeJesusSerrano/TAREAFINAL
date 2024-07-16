


function calculateEOQ(demand, orderCost, holdingCost) {
 
    if (isNaN(demand) || demand <= 0 || isNaN(orderCost) || orderCost <= 0 || isNaN(holdingCost) || holdingCost <= 0) {
        mostrarAdvertencia("Error: Alguno de los valores de entrada no es válido.");
        return null; 
    }


    return Math.sqrt((2 * demand * 365 * orderCost) / holdingCost);
}


let db;
const request = indexedDB.open("EOQDatabase", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("demand", "demand", { unique: false });
    objectStore.createIndex("orderCost", "orderCost", { unique: false });
    objectStore.createIndex("holdingCost", "holdingCost", { unique: false });
    objectStore.createIndex("eoq", "eoq", { unique: false });
};

request.onsuccess = function (event) {
    db = event.target.result;
    loadRecords();
};

request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.errorCode);
};


function addRecord(demand, orderCost, holdingCost, eoq) {
    const transaction = db.transaction(["records"], "readwrite");
    const objectStore = transaction.objectStore("records");
    const newRecord = { demand, orderCost, holdingCost, eoq };
    objectStore.add(newRecord);

    transaction.oncomplete = function () {
        displayRecord(newRecord);
        mostrarExito(); 
    };

    transaction.onerror = function (event) {
        console.error("Error adding record:", event.target.errorCode);
    };
}

function displayRecord(record) {
    const tableBody = document.getElementById("data-body");
    const newRow = document.createElement("tr");
    newRow.setAttribute("data-id", record.id);
    newRow.innerHTML = `
        <td class="demand">${record.demand}</td>
        <td>${record.orderCost}</td>
        <td>${record.holdingCost}</td>
        <td class="eoq">${record.eoq ? record.eoq.toFixed(2) : "N/A"}</td>
        <td>${record.eoq ? analyzeEOQ(record.eoq) : "N/A"}</td>
        <td>
            <button class="edit">Editar</button>
            <button class="delete">Eliminar</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}


function deleteRecord(event) {
    if (event.target.classList.contains("delete")) {
        const row = event.target.closest("tr");
        const id = Number(row.getAttribute("data-id"));

        const transaction = db.transaction(["records"], "readwrite");
        const objectStore = transaction.objectStore("records");
        objectStore.delete(id);

        transaction.oncomplete = function () {
            row.remove();
            mostrarEliminacionExito(); 
        };

        transaction.onerror = function (event) {
            console.error("Error deleting record:", event.target.errorCode);
        };
    }
}


function editRecord(event) {
    if (event.target.classList.contains("edit")) {
        const row = event.target.closest("tr");
        const cells = row.querySelectorAll("td");
        const id = Number(row.getAttribute("data-id"));

        const demand = parseFloat(cells[0].innerText);
        const orderCost = parseFloat(cells[1].innerText);
        const holdingCost = parseFloat(cells[2].innerText);

        document.getElementById("demand").value = demand;
        document.getElementById("order-cost").value = orderCost;
        document.getElementById("holding-cost").value = holdingCost;

        row.remove();


        const transaction = db.transaction(["records"], "readwrite");
        const objectStore = transaction.objectStore("records");
        objectStore.delete(id);

        transaction.oncomplete = function () {
            console.log("Record deleted for editing");
        };

        transaction.onerror = function (event) {
            console.error("Error deleting record for editing:", event.target.errorCode);
        };
    }
}


function analyzeEOQ(eoq) {
    const eoqValue = parseFloat(eoq);
    return `La cantidad de pedidos que la empresa deberá realizar es de ${eoqValue.toFixed(0)} unidades para que el inventario no se agote durante el tiempo de entrega.`;
}


document.getElementById("crud-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const demand = parseFloat(document.getElementById("demand").value);
    const orderCost = parseFloat(document.getElementById("order-cost").value);
    const holdingCost = parseFloat(document.getElementById("holding-cost").value);


    if (isNaN(demand) || isNaN(orderCost) || isNaN(holdingCost) || demand <= 0 || orderCost <= 0 || holdingCost <= 0) {
        mostrarAdvertencia("Error: Alguno de los valores de entrada no es válido.");
        return; 
    }

    const eoq = calculateEOQ(demand, orderCost, holdingCost);

    if (eoq !== null) {
        addRecord(demand, orderCost, holdingCost, eoq);
    } else {
        console.error("Error: No se pudo calcular el EOQ.");
    }


    this.reset();
});


document.getElementById("data-table").addEventListener("click", function (event) {
    editRecord(event);
    deleteRecord(event);
});


function loadRecords() {
    const transaction = db.transaction(["records"], "readonly");
    const objectStore = transaction.objectStore("records");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const records = event.target.result;
        records.forEach(record => {
            if (record.eoq !== null) {
                displayRecord(record);
            }
        });
    };

    request.onerror = function (event) {
        console.error("Error loading records:", event.target.errorCode);
    };
}


document.getElementById("download-pdf").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();


    doc.setFontSize(18);
    doc.text("Registro de EOQ", 14, 22);


    const headers = [["Demand", "Order Cost", "Holding Cost", "EOQ", "Analysis"]];
    const data = [];


    const transaction = db.transaction(["records"], "readonly");
    const objectStore = transaction.objectStore("records");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
        const records = event.target.result;
        records.forEach(record => {
            if (record.eoq !== null) {
                const row = [
                    record.demand,
                    record.orderCost,
                    record.holdingCost,
                    record.eoq.toFixed(2),
                    analyzeEOQ(record.eoq)
                ];
                data.push(row);
            }
        });

    
        doc.autoTable({
            head: headers,
            body: data,
            startY: 30,
            theme: 'grid'
        });


        doc.save("eoq_records.pdf");
    };

    request.onerror = function (event) {
        console.error("Error loading records:", event.target.errorCode);
    };
});


function soloNumeros(event) {
    const input = event.target;
    const value = input.value;
    
    
    const validPattern = /^(\d+\.?\d*)?$/;

    if (!validPattern.test(value)) {
        mostrarAdvertencia('Por favor, ingrese solo números.');
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


function mostrarExito() {
    Swal.fire({
        icon: 'success',
        title: 'Buen trabajo!',
        text: 'Haz clic en el botón!',
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


document.getElementById("demand").addEventListener("input", soloNumeros);
document.getElementById("order-cost").addEventListener("input", soloNumeros);
document.getElementById("holding-cost").addEventListener("input", soloNumeros);

