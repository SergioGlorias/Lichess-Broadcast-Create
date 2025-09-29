import * as cheerio from 'cheerio';
import { parsePgn } from "chessops/pgn";

const CRRoundLink = "https://s2.chess-results.com/tnr1234778.aspx?lan=1&art=2&rd=8" // replace with your chess-results.com round link
const LichessToken = process.env.LICHESS_TOKEN;
if (!LichessToken) {
    throw new Error("Missing LICHESS_TOKEN environment variable");
}

const roundId = "PaXSD7jE" // replace with your round ID

const normalize = str => str.trim().toLowerCase().replaceAll(",", "").replaceAll(/\s+/g, ' ');

const run = async () => {
    const pgn = await fetch(`https://lichess.org/broadcast/-/-/${roundId}.pgn`, {
        headers: {
            Authorization: `Bearer ${LichessToken}`,
            "User-Agent": "Get CR Results and Send to Lichess Script",
        },
    })
        .then(res => res.text())
        .then(pgn => parsePgn(pgn))

    console.log(`Fetched ${pgn.length} games from Lichess broadcast ${roundId}.`);

    //scrape chess-results.com for results
    const html = await fetch(CRRoundLink).then(res => res.text());
    const $ = cheerio.load(html);

    // find White and Black columns
    const table = $('.CRs1 tr');
    const headerCells = table.first().find('th, td');
    const headers = headerCells.map((i, el) => $(el).text().trim()).get();

    const [whiteIndex, blackIndex, resultIndex] = ['White', 'Black', 'Result'].map(h => headers.indexOf(h));

    if (whiteIndex === -1 || blackIndex === -1 || resultIndex === -1) {
        throw new Error("Could not find White, Black, or Result columns in the table header.");
    }
    const resultsMap = new Map();
    table.slice(1).each((_, row) => {
        const cells = $(row).find('td');
        resultsMap.set(
            `${normalize($(cells[whiteIndex]).text())}|${normalize($(cells[blackIndex]).text())}`,
            $(cells[resultIndex]).text().trim()
        );
    });

    console.log(`Scraped ${resultsMap.size} results from Chess-Results.com.`);

    for (const game of pgn) {
        const white = normalize(game.headers.get("White"));
        const black = normalize(game.headers.get("Black"));
        const key = `${white}|${black}`;
        if (resultsMap.has(key)) {
            let result = resultsMap.get(key);
            const resultMap = {
                "1 - 0": "1-0",
                "+ - -": "1-0",
                "0 - 1": "0-1",
                "- - +": "0-1",
                "½ - ½": "1/2-1/2",
                "- - -": "0-0"
            };
            if (resultMap[result]) {
                result = resultMap[result];
            } else {
                console.warn(`Unknown result format "${result}" for game between ${white} and ${black}. Skipping.`);
                continue;
            }

            const currentResult = game.headers.get("Result");
            if (currentResult === result) {
                console.log(`Game between ${white} and ${black} already has correct result ${result}. Skipping.`);
                continue;
            }

            const ResultTag = `[Result "${result}"]`;

            const gameId = game.headers.get("GameURL").split("/").pop();

            await fetch(`https://lichess.org/api/study/${roundId}/${gameId}/tags`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${LichessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Get CR Results and Send to Lichess Script",
                },
                body: `pgn=${encodeURIComponent(ResultTag)}`,
            })
                .then(res => {
                    if (res.status !== 204) {
                        throw new Error(`Failed to update result for game ${gameId} in round ${roundId}: ${res.status} ${res.statusText}`);
                    }
                    console.log(`Successfully updated result for game ${gameId} in round ${roundId} to ${result}`);
                })
        } else {
            console.warn(`No result found for game between ${white} and ${black}. Skipping.`);
        }
    }
    console.log("Update complete.");
}

run();

