import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
    vus: 300, // Anzahl der virtuellen Benutzer
    duration: '60s', // Dauer des Tests
};

export default function () {
    // Generieren von zufälligen staves-Werten
    const numValues = Math.floor(Math.random() * 2) + 1; // 1 bis 3 Werte
    let staves = Array.from({length: numValues}, () => Math.floor(Math.random() * 14) + 1).join(',');

    let url = `ws://localhost:8765/ws?type=client&staves=${staves}`;
    
    let res = ws.connect(url, {}, function (socket) {
        socket.on('open', function open() {
            console.log('connected');
        });

        // socket.on('message', function message(data) {
        //     console.log('Received message: ', data);
        // });

        socket.on('close', function close() {
            console.log('disconnected');
        });

        socket.setTimeout(function () {
            socket.close();
        }, 60000);
    });

    check(res, { 'status is 101': (r) => r && r.status === 101 });
}
