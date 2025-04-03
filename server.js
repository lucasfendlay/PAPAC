const fs = require('fs');
const path = require('path');

// Path to the shared folder and JSON file
const sharedFolderPath = "C:\PTC15939\Prime Therapeutics\Philadelphia PACE Benefit Center - PACAP"; // Replace with the actual shared folder path
const sharedFilePath = path.join(sharedFolderPath, "clients.json");

// Ensure the shared file exists
if (!fs.existsSync(sharedFilePath)) {
    fs.writeFileSync(sharedFilePath, JSON.stringify({}), 'utf8');
}

const SharedFolderStorage = {
    readData() {
        try {
            const data = fs.readFileSync(sharedFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading shared storage file:", error);
            return {};
        }
    },

    writeData(data) {
        try {
            fs.writeFileSync(sharedFilePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error("Error writing to shared storage file:", error);
        }
    }
};

// Intercept localStorage calls
const LocalStorageInterceptor = {
    getItem(key) {
        const data = SharedFolderStorage.readData();
        return data[key] || null;
    },

    setItem(key, value) {
        const data = SharedFolderStorage.readData();
        data[key] = value;
        SharedFolderStorage.writeData(data);
    },

    removeItem(key) {
        const data = SharedFolderStorage.readData();
        delete data[key];
        SharedFolderStorage.writeData(data);
    },

    clear() {
        SharedFolderStorage.writeData({});
    }
};

// Override the global localStorage object
window.localStorage = LocalStorageInterceptor;