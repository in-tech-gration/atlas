export default async function whatIsMyIp(options) {

    // IPv4
    const checkA = fetch("https://ipinfo.io/ip").then(response => response.text());
    const checkB = fetch("https://api.ipify.org/").then(response => response.text());
    const checkC = fetch("https://checkip.amazonaws.com/").then(response => response.text());

    // IPv6
    const checkD = fetch("https://ipecho.net/plain").then(response => response.text());
    const checkE = fetch("https://ifconfig.me/ip").then(response => response.text());
    // const checkF = fetch("https://api.myip.com/").then( response => response.text() );
    //  => {"ip":"<IPv6>","country":"<COUNTRY_NAME>","cc":"<COUNTRY_CODE>"}

    try {

        const response = await Promise.any([checkA, checkB, checkC, checkD, checkE]);
        console.log(response.trim());

    } catch (error) {

        console.log(error);

    }
}