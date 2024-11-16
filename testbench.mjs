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
        let responseBody = await res.json();
        console.log(`Code`, res.status, `\n`, responseBody, `\n`);

        // in the login case, write the new token if the request was successful
        if (url.endsWith("login") && responseBody.token)
            await writeFile(`tokens/${tokenFile}`, responseBody.token);
    } catch (e) {
        console.error(e);
    }
}

let tests = JSON.parse(await readFile('data/tests.json', 'utf-8'));

let i = 1;
for (const testCase of tests) {
    if (!existsSync('tokens'))
        await mkdir('tokens')
    process.stdout.write(`${i}) `)
    await testServer(...testCase);
    i++;
}