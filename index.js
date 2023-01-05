const WebSocket = require('ws');
const { createServer } = require('net');

const startClient = (wsAddress, target, port, cb) => {
    const tcpServer = createServer((socket) => {
        // new tcp connection
        const startDate = new Date();
        const id = makeid(5);

        createWS();
        let tcpSocket = socket, wsConnection, buffer = [];

        // on tcp receive
        tcpSocket.on('data', (data) => {
            // if ws connection != open, keep in buffer. if open, send directly.
            if (!wsConnection) {
                buffer.push(data);
            } else {
                wsConnection.send(data);
            }
        });

        // tcp connection close event
        tcpSocket.on('close', () => {
            tcpSocket = null;
        })

        // tcp connection on error (sudden abrupt)
        tcpSocket.on('error', (error) => {
            tcpSocket = null;
        })

        // websocket function
        function createWS() {
            const ws = new WebSocket(wsAddress, {
                perMessageDeflate: false,
                skipUTF8Validation: true
            });

            // on ws connection open
            ws.on('open', () => {
                console.log(`${new Date()}: ${id} WS open`);
                wsConnection = ws;
    
                // send pending buffer
                while (buffer.length) {
                    console.log(`${new Date()}: ${id} sending pending buffers`);
                    ws.send(buffer.shift());
                }
    
                // forward ws -> tcp. don't forward if tcp conn is closed
                ws.on('message', (msg) => {
                    if (tcpSocket) {
                        tcpSocket.write(msg);
                    }
                });
            });

            // on ws connection close
            ws.on('close', (code, reason) => {
                const endDate = new Date();
                console.log(`${new Date()}: ${id} WS close ${code} ${reason} - ${endDate.getTime() - startDate.getTime()}s`);
                wsConnection = null;
                if (tcpSocket) {
                    // destroy tcp connection if still open
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