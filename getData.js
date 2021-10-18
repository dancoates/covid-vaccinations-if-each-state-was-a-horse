const scraper = require('table-scraper');
const Luxon = require('luxon');
const fs = require('fs/promises');
const getPercentsForState = (data, state) => {
    const stateData = data.find(ii => ii.STATE.toLowerCase() === state);

    return {
        first: parseFloat(stateData['12+'].replace('%', '')) / 100,
        second: parseFloat(stateData['12+%nbsp'].replace('%', '')) / 100
    };
}

const cleanData = (data, field, max, maxPerc) => {
    return data.map(ii => {
        const progress = parseInt(ii[field].replace(/[^\d]/g, ''), 10) / max;

        return {
            date: Luxon.DateTime.fromFormat(ii.DATE, 'dd MMM yy'),
            abs: parseInt(ii[field].replace(/[^\d]/g, ''), 10),
            raw: ii[field],
            perc: maxPerc * progress,
            progress
        };
    });
}


(async () => {

    const firstDose = (state) => `https://covidlive.com.au/report/daily-vaccinations-first-doses/${state}`;
    const secondDose = (state) => `https://covidlive.com.au/report/daily-vaccinations-people/${state}`;
    const percentLow = 'https://covidlive.com.au/report/vaccinations-age-band-low';


    const states = ['nsw', 'vic', 'qld', 'act', 'wa', 'sa', 'tas', 'nt'];


    const percentLowResult = await scraper.get(percentLow);
    const stateData = percentLowResult.find(ii => ii.length >= 8);

    const statePercentages = {
        'nsw': getPercentsForState(stateData, 'nsw'),
        'vic': getPercentsForState(stateData, 'victoria'),
        'qld': getPercentsForState(stateData, 'queensland'),
        'wa': getPercentsForState(stateData, 'wa'),
        'sa': getPercentsForState(stateData, 'sa'),
        'act': getPercentsForState(stateData, 'act'),
        'tas': getPercentsForState(stateData, 'tasmania'),
        'nt': getPercentsForState(stateData, 'nt')
    };

    const statesByDay = {};

    for(const state of states) {

        const firstDoseData = (await scraper.get(firstDose(state))).find(ii => ii.length > 20);
        const secondDoseData = (await scraper.get(secondDose(state))).find(ii => ii.length > 20);

        const maxFirst = parseInt(firstDoseData[0].FIRST.replace(/[^\d]/g, ''), 10);
        const maxSecond = parseInt(secondDoseData[0].SECOND.replace(/[^\d]/g, ''), 10);

        const first = cleanData(firstDoseData, 'FIRST', maxFirst, statePercentages[state].first);
        const second = cleanData(secondDoseData, 'SECOND', maxSecond, statePercentages[state].second);

        statesByDay[state] = {first, second};

    }

    await fs.writeFile('data.json', JSON.stringify(statesByDay, null, 4));
})().catch(err => console.error(err, err.stack));