
    // Automatically export local storage data on page load
    window.onload = function () {
        cleanUpClients();
        exportLocalStorageOnLoad();
        importLocalStorageOnLoad();
        loadClients();
    };

    function loadClients() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const clientList = document.getElementById('clientList');
        clientList.innerHTML = '';
        clients.forEach((client) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="profileview.html?id=${client.id}">
                    ${client.firstName} ${client.lastName} | 
                    Phone: ${client.phoneNumber} | 
                    Address: ${client.streetAddress}, ${client.city}, ${client.state}, ${client.zipCode}, ${client.county}
                </a>`;
            clientList.appendChild(li);
        });
    }

    // Automatically export local storage data as a JSON file on page load
    function exportLocalStorageOnLoad() {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const dataStr = JSON.stringify(clients, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clients.json';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // Automatically import local storage data from a predefined file on page load
    function importLocalStorageOnLoad() {
        // Simulate importing a file (this requires a predefined file to be accessible)
        const predefinedFilePath = 'clients.json'; // Replace with the actual file path if hosted
        fetch(predefinedFilePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('File not found');
                }
                return response.json();
            })
            .then(importedClients => {
                if (!Array.isArray(importedClients)) {
                    console.error('Invalid file format');
                    return;
                }

                // Merge imported clients with existing clients
                let existingClients = JSON.parse(localStorage.getItem('clients')) || [];
                const mergedClients = mergeClients(existingClients, importedClients);

                // Save merged data back to local storage
                localStorage.setItem('clients', JSON.stringify(mergedClients));
                console.log('Clients imported successfully!');
            })
            .catch(error => {
                console.error('Error importing file:', error.message);
            });
    }

    // Merge two client arrays, avoiding duplicates by ID
    function mergeClients(existingClients, importedClients) {
        const clientMap = new Map();

        // Add existing clients to the map
        existingClients.forEach(client => clientMap.set(client.id, client));

        // Add imported clients to the map (overwriting duplicates)
        importedClients.forEach(client => clientMap.set(client.id, client));

        // Convert map back to an array
        return Array.from(clientMap.values());
    }
