import puppeteer from 'puppeteer';
import fs from "fs"

let max = 555;

(async () => {
    // import query_params
    const data = fs.readFileSync('./econ_act.csv', 'utf-8');
    let cached_densities = null;
    try {
        cached_densities = fs.readFileSync("./economic_activity_density.json")
    } catch { }
    const years = [2018]
    const core_words = ["blockchain"]  // could also loop though an array of core_words

    const records = data.split('\n');
    records.shift()

    const firstVals = records.map(r => r.split(',')[0].replace('"', ''));
    firstVals.shift();

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
    const unique_activities = firstVals.filter(onlyUnique);

    let densities = {
        index: 0
    }

    if (cached_densities) {
        densities = JSON.parse(cached_densities);
    }

    const getUrl = (start_year, end_year, core_word, key_title, key_text_1, key_text_2) => {
        key_title = replace_whitespaces(key_title)
        let url;
        switch (true) {
            case key_text_1 && key_text_2:
                url = `https://scholar.google.com/scholar?hl=en&lr=lang_en&as_sdt=0%2C5&as_ylo=${start_year}&as_yhi=${end_year}&q=intitle%3A${core_word}+AND+intitle%3A${key_title}+AND+%28${key_text_1}+OR+${key_text_2}%29&btnG=`
                break;
            case key_text_1:
                url = `https://scholar.google.com/scholar?hl=en&lr=lang_en&as_sdt=0%2C5&as_ylo=${start_year}&as_yhi=${end_year}&q=intitle%3A${core_word}+AND+intitle%3A${key_title}+AND+${key_text_1}&btnG=`
                break;
            default:
                url = `https://scholar.google.com/scholar?hl=en&lr=lang_en&as_sdt=0%2C5&as_ylo=${start_year}&as_yhi=${end_year}&q=intitle%3A${core_word}+AND+intitle%3A${key_title}&btnG=`
                break;
        }
        return url

    }

    const replace_whitespaces = s => {
        if (s.indexOf(' ') > -1)
            return '"' + s.replace(' ', '+') + '"';
        return s;
    }

    for (const year of years) {
        if (!densities[year]) {
            densities[year] = {}
        }
        for (const core_word of core_words) {

            for (var i = densities.index; i < records.length; i++) {

                const entry = records[i].split(',');
                const category = entry[0].replace('"', '');
                if (!densities[year][category]) {
                    densities[year][category] = 0;
                }

                let key_title = entry[1].replace('"', '');
                let key_text_1 = entry[2].replace('"', '');
                if (key_text_1 === "null") key_text_1 = null;
                let key_text_2 = entry[3].replace('"', '');
                if (key_text_1 === "null") key_text_2 = null;
                console.log(key_title + " " + key_text_1 + " " + key_text_2)

                // // pup
                const browser = await puppeteer.launch({ headless: false });
                const page = await browser.newPage();

                const url = getUrl(year, year, core_word, key_title, key_text_1, key_text_2)

                await page.goto(url);

                //   // Wait for the results page to load and display the results.
                const resultsSelector = '.gs_ab_mdw';
                await page.waitForSelector(resultsSelector);

                // // Extract the results from the page.
                const num = await page.evaluate(resultsSelector => {
                    const isDigits = val => /^\d+$/.test(val)



                    const num = document.querySelectorAll('.gs_ab_mdw')[1].textContent.split(' ').map(val => val.replace("’", "")).filter(isDigits)[0]
                    if (num === undefined) return 0
                    return parseInt(num);

                }, resultsSelector);
                densities[year][category] = densities[year][category] + num
                console.log(i, year, category, key_title, num)
                console.log(url + "\n")
                //   // Print all the files.
                await browser.close();
                densities.index = i + 1;
                fs.writeFileSync("economic_activity_density.json", JSON.stringify(densities));

                console.log((densities.index / max * 100).toFixed(1) + "%")
            }
        }
    }
})();