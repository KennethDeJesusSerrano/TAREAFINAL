
let db;
const request = indexedDB.open('RecipientesDB', 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore('recipientes', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('demand', 'demand', { unique: false });
    objectStore.createIndex('demandUnit', 'demandUnit', { unique: false });
    objectStore.createIndex('turnaroundTime', 'turnaroundTime', { unique: false });
    objectStore.createIndex('turnaroundTimeUnit', 'turnaroundTimeUnit', { unique: false });
    objectStore.createIndex('containerSize', 'containerSize', { unique: false });
    objectStore.createIndex('resultN', 'resultN', { unique: false });
    objectStore.createIndex('resultInventory', 'resultInventory', { unique: false });
    objectStore.createIndex('resultKanban', 'resultKanban', { unique: false });
};

request.onsuccess = (event) => {
    db = event.target.result;
    readAllRecords();
};

request.onerror = (event) => {
    mostrarAdvertencia('Database error: ' + event.target.errorCode);
};

function clearForm() {
    document.getElementById('calculoForm').reset();
    document.getElementById('DCR').value = ''; 
}

function saveRecord() {
    const id = document.getElementById('DCR').value;
    if (id) {
        updateRecord(parseInt(id));
    } else {
        addRecord();
    }
}

function addRecord() {
    const demand = parseFloat(document.getElementById('demand').value);
    const demandUnit = document.getElementById('demandUnit').value;
    const turnaroundTime = parseFloat(document.getElementById('turnaroundTime').value);
    const turnaroundTimeUnit = document.getElementById('turnaroundTimeUnit').value;
    const containerSize = parseFloat(document.getElementById('containerSize').value);

    if (isNaN(demand) || isNaN(turnaroundTime) || isNaN(containerSize)) {
        mostrarAdvertencia('Por favor, ingrese todos los valores.');
        return;
    }

    let adjustedDemand = demand;
    switch(demandUnit) {
        case 'percentage':
            adjustedDemand = demand / 100;
            break;
        case 'hours':
            adjustedDemand = demand / 60;
            break;
        case 'minutes':
            break;
        case 'number':
        default:
            break;
    }

    let adjustedTurnaroundTime = turnaroundTime;
    switch(turnaroundTimeUnit) {
        case 'percentage':
            adjustedTurnaroundTime = turnaroundTime / 100;
            break;
        case 'hours':
            adjustedTurnaroundTime = turnaroundTime * 60;
            break;
        case 'minutes':
            break;
        case 'number':
        default:
            break;
    }

    let N = (adjustedDemand * 60) * (adjustedTurnaroundTime) / (60 * containerSize);
    if (N < 1) {
        N = 1;
    }

    const maxInventory = Math.ceil(N) * containerSize;
    const K = Math.ceil(N) * containerSize;
    const roundedK = Math.ceil(K);

    const transaction = db.transaction(['recipientes'], 'readwrite');
    const objectStore = transaction.objectStore('recipientes');

    const record = {
        demand,
        demandUnit,
        turnaroundTime,
        turnaroundTimeUnit,
        containerSize,
        resultN: Math.ceil(N),
        resultInventory: Math.ceil(maxInventory),
        resultKanban: roundedK
    };

    const request = objectStore.add(record);
    request.onsuccess = () => {
        readAllRecords();
        mostrarExito('Registro agregado con éxito.');
        clearForm();
    };
    request.onerror = (event) => {
        mostrarAdvertencia('Error al agregar el registro: ' + event.target.errorCode);
    };
}

function updateRecord(id) {
    const demand = parseFloat(document.getElementById('demand').value);
    const demandUnit = document.getElementById('demandUnit').value;
    const turnaroundTime = parseFloat(document.getElementById('turnaroundTime').value);
    const turnaroundTimeUnit = document.getElementById('turnaroundTimeUnit').value;
    const containerSize = parseFloat(document.getElementById('containerSize').value);

    if (isNaN(demand) || isNaN(turnaroundTime) || isNaN(containerSize)) {
        mostrarAdvertencia('Por favor, ingrese todos los valores.');
        return;
    }

    let adjustedDemand = demand;
    switch(demandUnit) {
        case 'percentage':
            adjustedDemand = demand / 100;
            break;
        case 'hours':
            adjustedDemand = demand / 60;
            break;
        case 'minutes':
            break;
        case 'number':
        default:
            break;
    }

    let adjustedTurnaroundTime = turnaroundTime;
    switch(turnaroundTimeUnit) {
        case 'percentage':
            adjustedTurnaroundTime = turnaroundTime / 100;
            break;
        case 'hours':
            adjustedTurnaroundTime = turnaroundTime * 60;
            break;
        case 'minutes':
            break;
        case 'number':
        default:
            break;
    }

    let N = (adjustedDemand * 60) * (adjustedTurnaroundTime) / (60 * containerSize);
    if (N < 1) {
        N = 1;
    }

    const maxInventory = Math.ceil(N) * containerSize;
    const K = Math.ceil(N) * containerSize;
    const roundedK = Math.ceil(K);

    const transaction = db.transaction(['recipientes'], 'readwrite');
    const objectStore = transaction.objectStore('recipientes');

    const record = {
        id,  
        demand,
        demandUnit,
        turnaroundTime,
        turnaroundTimeUnit,
        containerSize,
        resultN: Math.ceil(N),
        resultInventory: Math.ceil(maxInventory),
        resultKanban: roundedK
    };

    const request = objectStore.put(record);  
    request.onsuccess = () => {
        readAllRecords();
        mostrarExito('Registro actualizado con éxito.');
        clearForm();
    };
    request.onerror = (event) => {
        mostrarAdvertencia('Error al actualizar el registro: ' + event.target.errorCode);
    };
}

function readAllRecords() {
    const transaction = db.transaction(['recipientes'], 'readonly');
    const objectStore = transaction.objectStore('recipientes');
    const request = objectStore.openCursor();
    const recordsTable = document.getElementById('recordsTable').getElementsByTagName('tbody')[0];
    recordsTable.innerHTML = '';

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const record = cursor.value;
            const row = recordsTable.insertRow();
            row.innerHTML = `
                <td>${record.demand}</td>
                <td>${record.demandUnit}</td>
                <td>${record.turnaroundTime}</td>
                <td>${record.turnaroundTimeUnit}</td>
                <td>${record.containerSize}</td>
                <td>${record.resultN}</td>
                <td>${record.resultInventory}</td>
                <td>${record.resultKanban}</td>
                <td>
                    <button class="edit" onclick="editRecord(${record.id})">Editar</button>
                    <button class="delete" onclick="deleteRecord(${record.id})">Eliminar</button>
                </td>
            `;
            cursor.continue();
        }
    };
}

function deleteRecord(id) {
    const transaction = db.transaction(['recipientes'], 'readwrite');
    const objectStore = transaction.objectStore('recipientes');
    const request = objectStore.delete(id);
    request.onsuccess = () => {
        readAllRecords();
        mostrarEliminacionExito();
    };
    request.onerror = (event) => {
        mostrarAdvertencia('Error al eliminar el registro: ' + event.target.errorCode);
    };
}

function editRecord(id) {
    const transaction = db.transaction(['recipientes'], 'readonly');
    const objectStore = transaction.objectStore('recipientes');
    const request = objectStore.get(id);
    request.onsuccess = (event) => {
        const record = event.target.result;
        document.getElementById('demand').value = record.demand;
        document.getElementById('demandUnit').value = record.demandUnit;
        document.getElementById('turnaroundTime').value = record.turnaroundTime;
        document.getElementById('turnaroundTimeUnit').value = record.turnaroundTimeUnit;
        document.getElementById('containerSize').value = record.containerSize;
        document.getElementById('DCR').value = record.id; 

        document.getElementById('saveButton').onclick = saveRecord; 
    };
    request.onerror = (event) => {
        mostrarAdvertencia('Error al recuperar el registro: ' + event.target.errorCode);
    };
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