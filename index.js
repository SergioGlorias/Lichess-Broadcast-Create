const axios = require("axios")
const dayjs = require("dayjs")
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

// Token

const token = "lip_XXXXXXXXXXXX" //https://lichess.org/account/oauth/token/create?scopes[]=study:write

// Broadcast Info
let name = "Carballo Open"

let roundType = "9-round Swiss"

let dS = "25th" 
let mS = "August"

let dE = "1st"
let mE = "September"

let location = "Carballo, Spain"

let timeControl = "Classical"
let timeStarted = 90
let timeincrement = 30
let timeAfter40Moves = 0

let officialWebsite = ""
let results = "https://chess-results.com/tnr801739.aspx?lan=1"

let autoLeaderboard = false // leaderboard

//Rounds
let tz = "Europe/Lisbon" //timezone

let d = 0 //delay for transmission

let isLCC = true    //if broadcast is URL LCC
let ifLCCurlIs = "" // URL LCC

const urlfn = (num) => ``

let rounds = [
    {
        name: "Round 1",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(1),
        startsAt: dayjs.tz("2023-08-25 16:00", tz).valueOf(),
    },
    {
        name: "Round 2",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(2),
        startsAt: dayjs.tz("2023-08-26 16:00", tz).valueOf(),
    },
    {
        name: "Round 3",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(3),
        startsAt: dayjs.tz("2023-08-27 09:00", tz).valueOf(),
    },
    {
        name: "Round 4",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(4),
        startsAt: dayjs.tz("2023-08-27 16:00", tz).valueOf(),
    },
    {
        name: "Round 5",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(5),
        startsAt: dayjs.tz("2023-08-28 16:00", tz).valueOf(),
    },
    {
        name: "Round 6",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(6),
        startsAt: dayjs.tz("2023-08-29 16:00", tz).valueOf(),
    },
    {
        name: "Round 7",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(7),
        startsAt: dayjs.tz("2023-08-30 16:00", tz).valueOf(),
    },
    {
        name: "Round 8",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(8),
        startsAt: dayjs.tz("2023-08-31 16:00", tz).valueOf(),
    },
    {
        name: "Round 9",
        syncUrl: isLCC ? ifLCCurlIs : urlfn(9),
        startsAt: dayjs.tz("2023-09-01 15:00", tz).valueOf(),
    },
/*    {
        name: "Round 10",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-08-25 15:00", tz).valueOf(),
    },
    {
        name: "Round 11",
        syncUrl: isLCC ? ifLCCurlIs : "",
        startsAt: dayjs.tz("2023-08-26 09:30", tz).valueOf(),
    },*/
]

// ======
const description = `${mS} ${dS} ${(dS === dE && mS === mE) ? "" : `- ${mS === mE ? "" : (mE + " ")}${dE}`} | ${roundType} | ${timeControl} time control`

let timeInfo = ""

if (timeAfter40Moves === 0) timeInfo = `Time control is ${timeStarted} minutes for the entire game, with a ${timeincrement}-second increment from move one.`
else timeInfo = `Time control is ${timeStarted} minutes for 40 moves, followed by ${timeAfter40Moves} minutes for the rest of the game with a ${timeincrement}-second increment beginning from move one.`


let markdown =
`The ${name} is a ${roundType}, held from the ${dS} ${mS === mE ? "" : `of ${mS} `}${(dS === dE && mS === mE) ? "" : `to the ${dE} `}of ${mE} in ${location}.

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
