import {readFile, writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs'

async function testServer(endpoint, method, tokenFile, msg) {
    let jwtToken;
    try {
        jwtToken = await readFile(`tokens/${tokenFile}`);
    } catch (e) {}

    let headers, body;
    if (["POST", "PUT", "PATCH"].includes(method)) {
        headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
        };
        body = JSON.stringify(msg);
    } else { // GET, DELETE
        headers = {
            "Authorization": `Bearer ${jwtToken}`
        };
    }

    try {
        let url = `http://localhost:3000${endpoint}`;
        let res = await fetch(url, {method, headers, body});
        res = await res.json();
        console.log(res);

        // in the login case, write the new token if the request was successful
        if (url.endsWith("login") && res.token)
            await writeFile(`tokens/${tokenFile}`, res.token);
    } catch (e) {
        console.error(e);
    }
}

let tests = JSON.parse(await readFile('data/tests.json'));

let i = 1;
for (const testCase of tests) {
    if (!existsSync('./tokens'))
        await mkdir('tokens')

    console.log(`${i}:`)
    await testServer(...testCase);
    i++;
}