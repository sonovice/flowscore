
import getStaticFile from './static/';

const COLOR_RESET = '\x1b[0m';
const COLOR_RED = '\x1b[31m';
const COLOR_GREEN = '\x1b[32m';

const COLOR_RED_BOX = '\x1b[41m\x1b[97m';
const COLOR_GREEN_BOX = '\x1b[42m\x1b[97m';


function serve(port) {
    const server = Bun.serve({
        hostname: '0.0.0.0',
        port,
        async fetch(req) {
            const url = new URL(req.url);
            let path = url.pathname.slice(1); // Remove leading '/'
            if (path == '') {
                path = 'index.html';
            }

            const file = getStaticFile(path);
            if (await file.exists()) {
                console.log(`[${new Date().toISOString()}] ${COLOR_GREEN}GET "${path}" ${COLOR_GREEN_BOX}200${COLOR_RESET}`);
                return new Response(file, { headers: {
                    'Content-Type': file.type
                }});
            } else {
                console.log(`[${new Date().toISOString()}] ${COLOR_RED}GET "${path}" ${COLOR_RED_BOX}404${COLOR_RESET}`);
                return new Response("Not Found", { status: 404 });
            }
        },
    });

    return server;
}

function main() {
    let currentPort = 8000;
    let serverStarted = false;
    let server;
    while(!serverStarted) {
        try {
            server = serve(currentPort);
            serverStarted = true;
        } catch (err) {
            console.error(`Could not start server at port ${currentPort}, trying ${currentPort + 1} now...`);
            currentPort += 1;
        }
    }
    
    console.log(`Server is running: http://localhost:${server.port}/`);
}

main();
