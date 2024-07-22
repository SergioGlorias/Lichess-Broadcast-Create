// Importar as bibliotecas
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('node:fs/promises')

// Definir a URL da página do torneio
const url = 'https://chess-results.com/tnr932616.aspx?lan=1';

// Fazer a requisição HTTP e obter o HTML da página
axios.get(url)
  .then(async response => {
    // Carregar o HTML no cheerio
    const $ = cheerio.load(response.data);

    // Selecionar a tabela de dados dos jogadores
    const table = $('.CRs1 tr');

    // Iterar sobre as linhas da tabela, ignorando a primeira (cabeçalho)
    let jogadores = await table.slice(1).map((i, element) => {
      // Obter os dados de cada coluna da linha
      const name = $(element).find('td:nth-child(4)').text().trim();
      const rating = $(element).find('td:nth-child(6)').text().trim();
      const title = $(element).find('td:nth-child(3)').text().trim();
      const fideid = $(element).find('td:nth-child(5)').text().trim();

      // Exibir os dados no console
      //console.log(`Name: ${name}, Rating: ${rating}, Title: ${title}`);

      return {
        name,
        rating,
        title,
        fideid
      }
    });

    let arr = []
    for await (i of jogadores) {
      //arr.push(`${i.name};${i.name};${i.rating !== "0" ? i.rating : ""};${i.title}`)
      let splitname = i.name.split(",")
      //arr.push(`${splitname[1].trim()} ${splitname[0].trim()};${i.name};${i.rating !== "0" ? i.rating : ""};${i.title}`)
      //arr.push(`${splitname[1].trim()} ${splitname[0].trim()};${splitname[1].trim()} ${splitname[0].trim()};${i.rating !== "0" ? i.rating : ""};${i.title}`)
      arr.push(`${splitname[1].trim()} ${splitname[0].trim()} = ${i.fideid ? i.fideid : "0" } ${["NM", "WNM"].includes(i.title) ? "/ " + i.title : ""}`)
      //arr.push(`${splitname[1].trim()}, ${splitname[0].trim()};${i.name};${i.rating !== "0" ? i.rating : ""};${i.title}`)
      //arr.push(`${splitname[0].trim()},${splitname[1].trim()};${i.name};${i.rating !== "0" ? i.rating : ""};${i.title}`)
    }

    await fs.writeFile(`cr-${Date.now().valueOf()}.txt`, arr.join("\n"), { encoding: "utf-8" })
  })
  .catch(error => {
    // Tratar possíveis erros na requisição ou no cheerio
    console.error(error);
  });

