const fs = require('fs');
const path = require('path');

const DEFAULT_SECRETS_PATH = '/etc/secrets/sapcp/';

// readK8SServices reads and returns the secrets from a directory
function readK8SServices() {
    console.log('readK8SServices');
    const secretsPath = DEFAULT_SECRETS_PATH;
    let result = {};

    try {
        if (fs.existsSync(secretsPath)) {
            result = readSecrets(secretsPath);
        }
    } catch (err) {
        console.error(`Error checking secrets path: ${err.message}`);
    }

    return result;
}

// readSecrets reads and returns the secrets from a directory
function readSecrets(secretsPath) {
    const result = {};

    try {
        const info = fs.statSync(secretsPath);
        if (!info.isDirectory()) {
            throw new Error('secrets path must be a directory');
        }

        const entries = fs.readdirSync(secretsPath, { withFileTypes: true });

        for (const entry of entries) {
            const serviceName = entry.name;
            const servicePath = path.join(secretsPath, serviceName);

            const serviceInfo = fs.statSync(servicePath);
            if (serviceInfo.isDirectory()) {
                const serviceInstances = readServiceInstances(serviceName, servicePath);
                Object.assign(result, serviceInstances);
            }
        }
    } catch (err) {
        console.error(`Error reading secrets: ${err.message}`);
    }

    return result;
}



// readServiceInstances reads and returns the service instances from a directory
function readServiceInstances(serviceName, servicePath) {
    const result = {};

    try {
        const entries = fs.readdirSync(servicePath, { withFileTypes: true });

        for (const entry of entries) {
            const instanceName = entry.name;
            const instancePath = path.join(servicePath, instanceName);

            if (entry.isDirectory()) {
                result[instanceName] = readInstance(serviceName, instanceName, instancePath);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${servicePath}: ${err.message}`);
    }

    return result;
}



// readInstance reads and returns the instance from a directory
function readInstance(serviceName, instanceName, instancePath) {
    // Read the files from the instance path
    const credentials = readFiles(instancePath);

    // Create an object to store the instance
    const instance = {
        credentials: credentials,
        name: instanceName,
        label: serviceName
    };

    return instance;
}



// readFiles reads and returns the files from a directory
function readFiles(dirPath) {
    const result = {};

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const filePath = path.join(dirPath, entry.name);

            if (entry.isFile()) {
                result[entry.name] = readFileContent(filePath);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dirPath}: ${err.message}`);
    }

    return result;
}


// readFileContent reads and parses the content of a file
function readFileContent(filePath) {
    try {
        // Read the file content into a string
        const content = fs.readFileSync(filePath, 'utf8');
        return content;
    } catch (err) {
        // Handle the error
        console.error(`Error reading file ${filePath}: ${err.message}`);
        return '';
    }
}


// isJsonObject checks if a string is a valid JSON string
function isJsonObject(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = { readK8SServices };