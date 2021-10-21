const scraper = require('table-scraper');
const Luxon = require('luxon');
const fs = require('fs/promises');
const axios = require('axios');
const getPercentsForState = (data, state) => {
    const stateData = data.find(ii => ii.STATE.toLowerCase() === state);

    return {
        first: parseFloat(stateData['12+'].replace('%', '')) / 100,
        second: parseFloat(stateData['12+%nbsp'].replace('%', '')) / 100
    };
}

const cleanData = (data, field, max, maxPerc) => {

    let prevPoint = {};

    return data
        .map((ii, index) => {
            const progress = parseInt(ii[field].replace(/[^\d]/g, ''), 10) / max;

            return {
                date: Luxon.DateTime.fromFormat(ii.DATE, 'dd MMM yy').toISODate(),
                absolute: parseInt(ii[field].replace(/[^\d]/g, ''), 10) || 0,
                percent: (maxPerc * progress) || 0,
            };
        })
        // sort by date asc
        .sort((a, b) => a.date > b.date ? 1 : -1)
        // fill in gaps
        .map((ii, index) => {

            const result = {
                date: ii.date,
                absolute: ii.absolute || prevPoint.absolute || 0,
                percent: ii.percent || prevPoint.percent || 0,
            };

            prevPoint = result;

            return result;
        });
}

const states = ['nsw', 'vic', 'qld', 'act', 'wa', 'sa', 'tas', 'nt'];

async function getTwelvePlus() {
    const firstDose = (state) => `https://covidlive.com.au/report/daily-vaccinations-first-doses/${state}`;
    const secondDose = (state) => `https://covidlive.com.au/report/daily-vaccinations-people/${state}`;
    const percentLow = 'https://covidlive.com.au/report/vaccinations-age-band-low';


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

        first.forEach(ff => {
            statesByDay[ff.date] = statesByDay[ff.date] || {date: ff.date};
            statesByDay[ff.date][`${state}_first_absolute`] = ff.absolute;
            statesByDay[ff.date][`${state}_first_percent`] = ff.percent;
        });

        second.forEach(ff => {
            statesByDay[ff.date] = statesByDay[ff.date] || {date: ff.date};
            statesByDay[ff.date][`${state}_second_absolute`] = ff.absolute;
            statesByDay[ff.date][`${state}_second_percent`] = ff.percent;
        });

    }
    const sorted = Object.values(statesByDay).sort((a, b) => a.date > b.date ? 1 : -1).filter(ii => ii.date >= '2021-04-01');

    await fs.writeFile('twelvePlus.json', JSON.stringify(sorted, null, 4));
}

const getStateData = (row, type) => {

    const data = {
        date: row.DATE_AS_AT,
    };

    states.forEach(state => {
        const upperState = state.toUpperCase();
        data[`${state}_first_absolute`] = row[`AIR_${upperState}_${type}_FIRST_DOSE_COUNT`],
        data[`${state}_first_percent`] = row[`AIR_${upperState}_${type}_FIRST_DOSE_PCT`] / 100,
        data[`${state}_second_absolute`] = row[`AIR_${upperState}_${type}_SECOND_DOSE_COUNT`],
        data[`${state}_second_percent`] = row[`AIR_${upperState}_${type}_SECOND_DOSE_PCT`] / 100
    });

    return data;

};

async function getOthers() {
    const resp = await axios.get('https://vaccinedata.covid19nearme.com.au/data/air.json');
    const data = resp.data;

    const twelveToFifteen = data.map((row) => getStateData(row, '12_15')).filter(row => row.nsw_first_absolute !== undefined);
    const sixteenPlus = data.map((row) => getStateData(row, '16_PLUS')).filter(row => row.nsw_first_absolute !== undefined);;
    const fiftyPlus = data.map((row) => getStateData(row, '50_PLUS')).filter(row => row.nsw_first_absolute !== undefined);;
    const seventyPlus = data.map((row) => getStateData(row, '70_PLUS')).filter(row => row.nsw_first_absolute !== undefined);;

    await fs.writeFile('twelveToFifteen.json', JSON.stringify(twelveToFifteen, null, 4));
    await fs.writeFile('sixteenPlus.json', JSON.stringify(sixteenPlus, null, 4));
    await fs.writeFile('fiftyPlus.json', JSON.stringify(fiftyPlus, null, 4));
    await fs.writeFile('seventyPlus.json', JSON.stringify(seventyPlus, null, 4));
}


(async () => {

    await getTwelvePlus().catch(err => console.error(err));
    await getOthers().catch(err => console.error(err));

})();