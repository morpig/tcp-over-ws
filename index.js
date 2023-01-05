const WebSocket = require('ws');
const { createServer } = require('net');

const startClient = (wsAddress, target, port, cb) => {
    const tcpServer = createServer((socket) => {
        const id = makeid(5);

        createWS();
        let tcpSocket = socket, wsConnection, buffer = [];

        tcpSocket.on('data', (data) => {
            if (!wsConnection) {
                buffer.push(data);
            } else {
                wsConnection.send(data);
            }
        });

        tcpSocket.on('close', () => {
            tcpSocket = null;
        })

        function createWS() {
            const ws = new WebSocket(wsAddress, {
                perMessageDeflate: false,
                skipUTF8Validation: true
            });

            ws.on('open', () => {
                console.log(`${new Date()}: ${id} WS open`);
                wsConnection = ws;
    
                while (buffer.length) {
                    console.log(`${new Date()}: ${id} sending pending buffers`);
                    wsConnection.send(buffer.shift());
                }
    
                ws.on('message', (msg) => {
                    if (tcpSocket) {
                        tcpSocket.write(msg);
                    }
                });
            });

            ws.on('close', (code, reason) => {
                console.log(`${new Date()}: ${id} WS close ${code} ${reason}`);
                wsConnection = null;
                if (tcpSocket) {
                    tcpSocket.destroy();
                }
            })
    
            ws.on('error', (err) => {
                if (tcpSocket) {
                    console.log(`${new Date()}: ${id} error: ${err}`);
                }
            })
        }
    });

    tcpServer.listen(port, cb);
    return tcpServer;
}

function makeid(length) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

startClient(process.env.WS_URL, null, process.env.PORT, (err) => {
    console.log(`${new Date()}: start WS client ${process.env.WS_URL} ${process.env.PORT}`);
})

module.exports = startClient;