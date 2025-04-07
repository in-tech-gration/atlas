export default function prop(jsonString, propName) {

    if (!jsonString) {
        return console.log("Please provide some JSON content.");
    }

    if (!propName) {
        return console.log("Please provide a property name.");
    }

    let json;

    try {

        json = JSON.parse(jsonString);

        if ( Array.isArray(json) ) {

            const mapped = json.map((item) => item[propName]);
            return JSON.stringify(mapped);

        } else if ( typeof json === "object" ) {

            return JSON.stringify(json[propName]);

        } else {

            console.log("Invalid JSON content.");

        }

    } catch (error) {
        throw new Error("Invalid JSON string provided.");
    }

}