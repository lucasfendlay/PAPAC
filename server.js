const couchbase = require('couchbase');

// Initialize Couchbase connection
const cluster = new couchbase.Cluster('couchbases://cb.pxbyzbujtqlz9pfi.cloud.couchbase.com', {
    username: 'PACAP',
    password: 'AppleID!2345'
});
const bucket = cluster.bucket('Clients');
const collection = bucket.defaultCollection();

const SharedFolderStorage = {
    async readData() {
        try {
            const result = await collection.get('sharedStorage');
            return result.content || {};
        } catch (error) {
            if (error instanceof couchbase.DocumentNotFoundError) {
                console.warn("Document not found, returning empty object.");
                return {};
            }
            console.error("Error reading from Capella database:", error);
            return {};
        }
    },

    async writeData(data) {
        try {
            await collection.upsert('sharedStorage', data);
        } catch (error) {
            console.error("Error writing to Capella database:", error);
        }
    }
};

// Intercept localStorage calls
const LocalStorageInterceptor = {
    async getItem(key) {
        const data = await SharedFolderStorage.readData();
        return data[key] || null;
    },

    async setItem(key, value) {
        const data = await SharedFolderStorage.readData();
        data[key] = value;
        await SharedFolderStorage.writeData(data);
    },

    async removeItem(key) {
        const data = await SharedFolderStorage.readData();
        delete data[key];
        await SharedFolderStorage.writeData(data);
    },

    async clear() {
        await SharedFolderStorage.writeData({});
    }
};

// Example usage
(async () => {
    await LocalStorageInterceptor.setItem('username', 'JohnDoe');
    console.log(await LocalStorageInterceptor.getItem('username')); // Output: JohnDoe
    await LocalStorageInterceptor.removeItem('username');
    await LocalStorageInterceptor.clear();
})();

(async () => {
    try {
        await cluster.ping();
        console.log("Cluster connection successful!");
    } catch (error) {
        console.error("Cluster connection failed:", error);
    }
})();

(async () => {
    try {
        await LocalStorageInterceptor.setItem('username', 'JohnDoe');
        console.log("Set username to JohnDoe");
        const username = await LocalStorageInterceptor.getItem('username');
        console.log("Retrieved username:", username); // Should log: JohnDoe
        await LocalStorageInterceptor.removeItem('username');
        console.log("Removed username");
        await LocalStorageInterceptor.clear();
        console.log("Cleared all data");
    } catch (error) {
        console.error("Error during example usage:", error);
    }
})();