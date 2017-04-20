const Language = require('@google-cloud/language');

function extractEntities(text) {
    if(typeof text !== "string") {
        throw new Error(`extractEntities expected a string, got: ${text}`);
    }
    
    const language = Language();

    try {
        const document = language.document({
            content: text.toString()
        });
        return document.detectEntities()
            .then((results) => {
                const entities = results[0];
                return entities;
            })
            .catch((err) => {
                console.error(err);
            });  
        
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports.extractEntities = extractEntities;