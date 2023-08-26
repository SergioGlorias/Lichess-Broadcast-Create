const axios = require("axios")
const dayjs = require("dayjs")
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

// Token

const token = "lip_XXXXXXXXXXXX" //https://lichess.org/account/oauth/token/create?scopes[]=study:write

// Broadcast Info
let name = "Niteroi Chess Open 2023 Blitz"

let roundType = "9-round Swiss"

let dS = "9th" 
let mS = "September"

let dE = "9th"
let mE = "September"

let location = "Niteroi, Brazil"

let timeControl = "Blitz"

let timeStarted = 3
let timeincrement = 2
let timeAfter40Moves = 0

let officialWebsite = "https://www.niteroichessopen.com.br/"
let results = "https://chess-results.com/tnr757186.aspx?lan=1"

let autoLeaderboard = false // leaderboard

//Rounds
let tz = "America/Sao_Paulo" //timezone

let d = 0 //delay for transmission

let isLCC = true    //if broadcast is URL LCC
let ifLCCurlIs = "" // URL LCC

let rounds = [
    {
        name: "Round 1",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 14:00", tz).valueOf(),
    },
    {
        name: "Round 2",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 14:15", tz).valueOf(),
    },
    {
        name: "Round 3",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 14:30", tz).valueOf(),
    },
    {
        name: "Round 4",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 14:45", tz).valueOf(),
    },
    {
        name: "Round 5",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 15:00", tz).valueOf(),
    },
    {
        name: "Round 6",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 15:15", tz).valueOf(),
    },
    {
        name: "Round 7",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 15:30", tz).valueOf(),
    },
    {
        name: "Round 8",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 15:45", tz).valueOf(),
    },
    {
        name: "Round 9",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-09-09 16:00", tz).valueOf(),
    },
]

// ======
const description = `${mS} ${dS} ${(dS === dE && mS === mE) ? "" : `- ${mS === mE ? "" : (mE + " ")}${dE}`} | ${roundType} | ${timeControl} time control`

let timeInfo = ""

if (timeAfter40Moves === 0) timeInfo = `Time control is ${timeStarted} minutes for the entire game, with a ${timeincrement}-second increment from move one.`
else timeInfo = `Time control is ${timeStarted} minutes for 40 moves, fallowed by ${timeAfter40Moves} minutes for the rest of the game with a ${timeincrement}-second increment beginning from move one.`


let markdown =
`The ${name} is ${roundType}, held from the ${dS} ${mS === mE ? "" : `of ${mS} `}${(dS === dE && mS === mE) ? "" : `to the ${dE} `}of ${mE} in ${location}.

${timeInfo}

${officialWebsite === "" ? "" : `[Official Website](${officialWebsite}) | `}[Results](${results})`


async function run() {

    let dataC = { name, description, markdown, autoLeaderboard }
    let Authorization = `Bearer ${token}`
    let Accept = "application/json"

    let broadcast = await axios.post("https://lichess.org/broadcast/new", dataC, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization,
            Accept
        }
    }).catch((e) => {
        console.error(e.response.data)
        process.exit(1)
    })

    console.log(broadcast.data)

    let key = 1
    for await (let r of rounds) {
        if (isLCC) {
            r.syncUrlRound = key
            key = key + 1
        }
        if (d !== 0) {
            r.delay = d
        }
        let round = await axios.post(`https://lichess.org/broadcast/${broadcast.data.tour.id /*"jfb2DlQj"*/}/new`, r, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization,
                Accept
            }
        }).catch((e) => {
            console.error(e.response.data)
            process.exit(1)
        })
        console.log(round.data)
    }
}
run()
