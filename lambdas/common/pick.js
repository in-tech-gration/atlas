export default function join(jsonString, propName) {

    if (!jsonString) {
        return console.log("Please provide some JSON content.");
    }

    if (!propName) {
        return console.log("Please provide a propName.");
    }

    let json;

    try {

        json = JSON.parse(jsonString);

        if ( Array.isArray(json) ) {

            const picked = json.map( item => {
                return {
                    [propName]: item[propName]
                }
            });
            return JSON.stringify(picked);
            // return JSON.stringify(picked, null, 2);

        } else if ( typeof json === "object" ) {

            const picked = {
                [propName]: json[propName]
            };
            return JSON.stringify(picked);
            // return JSON.stringify(picked, null, 2);

        } else {

            console.log("Invalid JSON content.");

        }

    } catch (error) {
        throw new Error("Invalid JSON string provided.");
    }
}
