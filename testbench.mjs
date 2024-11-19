import {readFile, writeFile, mkdir, rm} from "fs/promises";
import {existsSync, createWriteStream} from "fs";
import {Worker, isMainThread, threadId, BroadcastChannel} from "worker_threads";
import {fileURLToPath} from "url";
import {Mutex} from "async-mutex";

const mutex = new Mutex();
await performTests({numThreads: 10, numRandomized: 30});

async function performTests(options) {
    if (options?.numThreads) {
        if (isMainThread) {
            let totalThreads = options?.numThreads;
            const __filename = fileURLToPath(import.meta.url);
            for (let index = 0; index < totalThreads; index++) {
                new Worker(__filename);
            }
        } else if (options?.numRandomized)
            await randomizedTests(options?.numRandomized, true, `result-logs/Thread ${threadId}`)
        else
            await normalTests(`result-logs/Thread ${threadId}`)
    } else { // single threaded case
        if (options?.numRandomized)
            await randomizedTests(options?.numRandomized, true)
        else
            await normalTests()
    }
}

async function sendRequest(resultStream, endpoint, method, tokenFile, msg) {
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
    } else  // GET, DELETE
        headers = {"Authorization": `Bearer ${jwtToken}`};

    try {
        let url = `http://localhost:3000${endpoint}`;
        let res = await fetch(url, {method, headers, body});
        let responseBody = await res.json();

        if (resultStream)
            resultStream.write(`${JSON.stringify(responseBody)}\n`);
        else
            console.log(responseBody, `\n`);

        // in the login case, write the new token if the request was successful
        if (url.endsWith("login") && responseBody.token) {
            const release = await mutex.acquire();
            await writeFile(`tokens/${tokenFile}`, responseBody.token);
            release();
        }
    } catch (e) {
        console.error(e);
    }
}


async function normalTests(resultLogFile) {
    const tests = JSON.parse(await readFile("data/tests.json", "utf-8"));
    if (!existsSync("tokens"))
        await mkdir("tokens")

    let resultStream;
    if (resultLogFile) {
        if (!existsSync(resultLogFile.split("/")[0]))
            await mkdir(resultLogFile.split("/")[0]);
        resultStream = await createStream(resultLogFile);
    }

    for (const testCase of tests)
        await sendRequest(resultStream, ...testCase);
}


async function randomizedTests(num, logRequests = false, resultLogFile) {
    let tests = JSON.parse(await readFile("data/tests.json", "utf-8"))
    let testHistory = [];
    if (!existsSync("tokens"))
        await mkdir("tokens")

    let resultStream;
    if (resultLogFile) {
        if (!existsSync(resultLogFile.split("/")[0]))
            await mkdir(resultLogFile.split("/")[0]);
        resultStream = await createStream(resultLogFile);
    }

    for (let i = 0; i < num; i++) {
        let rnd = Math.floor(Math.random() * tests.length);
        await sendRequest(resultStream, ...(tests[rnd]));
        if (logRequests)
            testHistory.push(tests[rnd]);
    }

    if (logRequests) {
        testHistory.push(tests[30]);
        testHistory.push(tests[31]);
        let dataToWrite = JSON.stringify(testHistory, null, 2);
        await writeFile("data/testsHistory.json", dataToWrite);
    }
}

async function createStream(logFile) {
    try {
        if (logFile) {
            if (existsSync(logFile))
                await rm(logFile);
            return createWriteStream(logFile, {flags: 'a'});
        }
    } catch (e) {
        console.error(e);
    }
}