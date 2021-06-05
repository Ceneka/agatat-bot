const cors = require('cors')
const express = require('express')
const app = express()

app.use(cors())

//configuracion
let port = 3000;
let registrados = {}
let ultimos_registrados = {}
let gameSettings = {
    maxPlayers: 999,
    onlySubs: false,
}
const canal = 'sralmendrita'
const comando_play = ["!jugar", "!play", "!p"]

app.listen(port, () => {
    console.warn(`Server andando en http://localhost:${port}`)
})


app.get('/', (req, res) => {
    return res.status(200).json(constructify(registrados))
})

app.get('/lasts', (req, res) => {
    let lasts = ultimos_registrados
    ultimos_registrados = {}
    return res.status(200).json(constructify(lasts))
})

app.get('/reset', (req, res) => {
    
    let max_participantes = Number.isInteger(parseInt(req.query.maxplayers)) ? parseInt(req.query.maxplayers) : 999
	let solo_sub = req.query.onlysub === "1"
    
    ultimos_registrados = {}
	gameSettings = { 
        maxPlayers: max_participantes,
        onlySubs: solo_sub 
    }

    let txt_solo_sub = solo_sub ? 'sólo para subs' : 'para cualquiera'
    console.warn(`Partida reiniciada ${txt_solo_sub} con máximo de ${max_participantes} participantes`)

	return res.status(200).json(constructify({}))
})

//Para convertir el array en algo que c3 entienda
const constructify = (obj, maxp = 999) => {

	let arr = []

	//convertimos el objeto en un array
	for (const property in obj) {
		let user = [[obj[property].displayName], [obj[property].subscriber ? 1 : 0], [obj[property].clase]]
		arr.push(user)
	}

	if (arr.length > 0) {
		return { "c2array": true, "size": [arr.length, arr[0].length, 1], "data": arr.slice(0, maxp) } //devolvemos el arr sliceado al max, por si por alguna razon se agregaron mas
	} else {
		return { "c2array": true, "size": [0, 0, 0], "data": [] }
	}
}

//CONECTION WITH TWITCH
const tmi = require('tmi.js');

const client = new tmi.Client({
	connection: { reconnect: true },
	identity: {
		username: 'agatatgame',
		password: 'asdf'
	},
	channels: [canal]
});

if (!client._isConnected()) {
	client.connect();
}

client.on('message', (channel, tags, message, self) => {

	let comandos = message.toLocaleLowerCase('en-US').split(' ')

	if (comando_play.includes(comandos[0])) {

        //chequeamos si es solo sub
        if (gameSettings.onlySubs) {
            if (!tags['subscriber']) {
                return true;
            }
        }

        //chequeamos el maximo
        if ((Object.keys(registrados).length - 1) >= gameSettings.maxPlayers) {
            return true;
        }

        //chequeamos si hay clase elegida
        let clase = 0;
        if (comandos.length > 1) {
            switch (comandos[1].toLocaleLowerCase('en-US')) {
                case "revna":
                case "revnna": clase = 1; break;
                case "blasto": clase = 2; break;
                case "almendrita": clase = 3; break;
                case "trika": clase = 4; break;
                case "bruno": clase = 5; break;
                case "rapidito": clase = 6; break;
                case "gordito": clase = 7; break;
                case "tramposito": clase = 8; break;
                case "panquequito": clase = 9; break;
                case "huevo": clase = 10; break;
                default: clase = 0; break;
            }
        }

        //si no esta el usuario en el objeto
        if (!(tags.username in registrados)) {
            let objAgregar = { displayName: tags['display-name'], subscriber: tags['subscriber'], clase }

            registrados[tags['display-name']] = objAgregar
            ultimos_registrados[tags['display-name']] = objAgregar

            let claseText = clase != 0 ? ` con ${comandos[1].toLocaleLowerCase('en-US')}` : ""
            let chat_msj = `@${tags["display-name"]} juega${claseText}!`

            console.log(chat_msj)
            client.say(channel, chat_msj)
        }
	}
})