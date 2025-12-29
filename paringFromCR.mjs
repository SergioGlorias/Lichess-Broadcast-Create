import * as cheerio from "cheerio";

const CRRoundLinks = [
  {
    Link: "https://s2.chess-results.com/tnr1313076.aspx?lan=1&art=2&rd=8",
    slice: 50,
  }, // Open Blitz
  {
    Link: "https://s2.chess-results.com/tnr1313077.aspx?lan=1&art=2&rd=8",
    slice: 50,
  }, // Women Blitz
];

const roundId = "QQJkEzGd"; // replace with your round ID

const LichessToken = process.env.LICHESS_TOKEN;

if (!LichessToken) {
  throw new Error("Missing LICHESS_TOKEN environment variable");
}

const run = async () => {
  const parings = [];

  for (const { Link, slice } of CRRoundLinks) {
    const html = await fetch(Link).then((res) => res.text());
    const $ = cheerio.load(html);

    // find White and Black columns
    const table = $(".CRs1 tr");
    const headerCells = table.first().find("th, td");
    const headers = headerCells.map((i, el) => $(el).text().trim()).get();

    const [whiteIndex, blackIndex] = ["White", "Black"].map((h) =>
      headers.indexOf(h)
    );

    if (whiteIndex === -1 || blackIndex === -1) {
      throw new Error(
        "Could not find White or Black columns in the table header."
      );
    }
    const paringsSection = [];
    table.slice(1, slice).each((_, row) => {
      const cells = $(row).find("td");
      paringsSection.push({
        white: $(cells[whiteIndex]).text().replaceAll(/\s+/g, " ").replaceAll("*)", "").trim(),
        black: $(cells[blackIndex]).text().replaceAll(/\s+/g, " ").replaceAll("*)", "").trim(),
      });
    });
    parings.push(paringsSection);
  }

  const paringsString = parings
    .map((section) =>
      section.map((paring) => `${paring.white} ; ${paring.black}`).join("\n")
    )
    .join("\n");

  console.log(paringsString);

  // send parings to lichess
  const response = await fetch(
    "https://lichess.org/broadcast/round/" + roundId + "/edit?patch=true",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + LichessToken,
      },
      body: new URLSearchParams({
        reorder: paringsString,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update parings on Lichess: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
  
  console.log("Parings updated successfully on Lichess.");
};

run().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});