import { parsePgn } from "chessops/pgn";
//read ./results.json and send results to lichess in node.js
import fs from "fs";

const results = JSON.parse(fs.readFileSync("./results.json", "utf8"));

const LichessToken = process.env.LICHESS_TOKEN;
if (!LichessToken) {
  throw new Error("Missing LICHESS_TOKEN environment variable");
}

const roundId = "hNNTqJH1"; // replace with your round ID

const normalize = (str) =>
  str
    .replaceAll("*)", "")
    .trim()
    .toLowerCase()
    .replaceAll(",", "")
    .replaceAll(/\s/g, "")
    .replaceAll(".", "");

const run = async () => {
  const pgn = await fetch(`https://lichess.org/broadcast/-/-/${roundId}.pgn`, {
    headers: {
      Authorization: `Bearer ${LichessToken}`,
      "User-Agent": "Get CR Results and Send to Lichess Script",
    },
  })
    .then((res) => res.text())
    .then((pgn) => parsePgn(pgn));

  console.log(`Fetched ${pgn.length} games from Lichess broadcast ${roundId}.`);

  // translate results.json into a map of normalized player names to results
  // if contains "Bo." ignore
  // like  "Round 1 on 2026/06/17 at 2:00PM (GMT+8)": "Bo.",
  // example:
  // {
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)": "Bo.",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_2": "1",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_3": "WR Chess",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_4": "Rtg",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_5": "-",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_6": "25",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_7": "Duobeniajan Costa Calida Esj",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_8": "Rtg",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_9": "5 : 1"
  // },
  // {
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)": "1.1",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_2": "GM",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_3": "So, Wesley",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_4": "2719",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_5": "-",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_6": "GM",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_7": "Ibarra Jerez, Jose Carlos",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_8": "2535",
  //   "Round 1 on 2026/06/17 at 2:00PM (GMT+8)_9": "½ - ½"
  // },

  // filter out any results that contain "Bo."
  // note: json is array of objects
  
  const onlyGames = results.filter((r) => {
    return !Object.values(r).some((v) => v.includes("Bo."));
  });
  const resultsMap = onlyGames.reduce((map, r) => {
    const white = normalize(r[Object.keys(r)[2]]);
    const black = normalize(r[Object.keys(r)[6]]);
    const result = r[Object.keys(r)[8]];
    const resultMap = {
        "1 - 0": "1-0",
        "+ - -": "1-0",
        "0 - 1": "0-1",
        "- - +": "0-1",
        "½ - ½": "1/2-1/2",
        "- - -": "0-0",
      };
    map.set(`${white}|${black}`, resultMap[result]);
    map.set(`${black}|${white}`, resultMap[result]);
    return map;
  }, new Map());

  console.log(`Scraped ${resultsMap.size} results from results.json.`);

  for (const game of pgn) {
    const white = normalize(game.headers.get("White"));
    const black = normalize(game.headers.get("Black"));
    const key = `${white}|${black}`;
    if (resultsMap.has(key)) {
      let result = resultsMap.get(key);

      const currentResult = game.headers.get("Result");
      if (currentResult === result) {
        console.log(
          `Game between ${white} and ${black} already has correct result ${result}. Skipping.`
        );
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
      }).then((res) => {
        if (res.status !== 204) {
          throw new Error(
            `Failed to update result for game ${gameId} in round ${roundId}: ${res.status} ${res.statusText}`
          );
        }
        console.log(
          `Successfully updated result for game ${gameId} in round ${roundId} to ${result}`
        );
      });
    } else {
      console.warn(
        `No result found for game between ${white} and ${black}. Skipping.`
      );
    }
  }
  console.log("Update complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});