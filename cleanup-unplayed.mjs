const LichessToken = process.env.LICHESS_TOKEN;
if (!LichessToken) {
    throw new Error("Missing LICHESS_TOKEN environment variable");
}

import { parsePgn } from "chessops/pgn";

const broadcastId = "UByrrEx3"; // replace with your broadcast ID

const run = async () => {
    const pgn = await fetch(`https://lichess.org/api/broadcast/${broadcastId}.pgn`, {
        headers: {
            Authorization: `Bearer ${LichessToken}`,
            "User-Agent": "Cleanup Unplayed Games Script",
        },
    })
        .then(res => res.text())
        .then(pgn => parsePgn(pgn))
        .then(pgn => pgn.filter(game => game.headers.get("Termination") === "Unplayed"))
        .then(games => games.filter(game => Array.from(game.moves.mainline()).length >= 2));

    console.log(`Found ${pgn.length} unplayed games with at least 2 moves.`);

    if (pgn.length === 0) {
        console.log("No unplayed games to clean up.");
        return;
    }

    for (const game of pgn) {
        const [roundId, gameId] = game.headers.get("GameURL").split("/").slice(-2);

        const TerminationTagEmpty = "[Termination \"\"]";

        //https://lichess.org/api#tag/Studies/operation/apiStudyChapterTags
        // https://lichess.org/api/study/{roundId}/{gameId}/tags
        // path Parameters roundId

        await fetch(`https://lichess.org/api/study/${roundId}/${gameId}/tags`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${LichessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Cleanup Unplayed Games Script",
            },
            body: `pgn=${encodeURIComponent(TerminationTagEmpty)}`,
        })
            .then(res => {
                if (res.status !== 204) {
                    throw new Error(`Failed to update tags for game ${gameId} in round ${roundId}: ${res.status} ${res.statusText}`);
                }
                console.log(`Successfully updated tags for game ${gameId} in round ${roundId}`);
            })

    }
    console.log("Cleanup complete.");
}

run();