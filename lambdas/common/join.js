export default function join(jsonString, arg = ",") {

    if (!jsonString) {
        return console.log("Please provide some JSON content.");
    }

    let json;

    try {
        json = JSON.parse(jsonString);
        if ( !Array.isArray(json) ) {
            throw new Error("Invalid JSON content. Must be an array.");
        }
        return JSON.stringify(json.join(arg));
    }
    catch (error) {
        throw new Error("Invalid JSON string provided.");
    }

}