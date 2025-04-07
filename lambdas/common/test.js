/**
 * 
 * @param {JSON} input 
 * @param {string} arg 
 * @returns {JSON}
 */
export default function test( jsonString, arg ){

    if (!jsonString) {
        return console.log("Please provide some JSON content.");
    }

    let json;

    try {

        json = JSON.parse(jsonString);
        console.log("Parsed JSON:", json);
        
    } catch (error) {

        throw new Error("Invalid JSON string provided.");

    }

    console.log("Just [test]ing!", `stdin: ${jsonString}`, `arg: ${arg}`);
    return JSON.stringify({ jsonString, arg });

}