

const toPercent = (num) => {
    return num ? (num * 100) + '%' : 0;
};

const toInvPercent = (num) => {
    return num ? (100 - (num * 100)) + '%' : '100%';
};

const lerp =  (v1, v2, amt) => {
    amt = amt < 0 ? 0 : amt;
    amt = amt > 1 ? 1 : amt;
    return v1 + (v2 - v1) * amt;
};

(async () => {
    // state
    let day = 0;
    let playing = true;
    let previousDay = -1;
    const speed = 0.2;
    const animSpeed = 0.5;


    // get data
    const twelvePlusData = await (await fetch('twelvePlus.json')).json();
    const twelveToFifteenData = await (await fetch('twelveToFifteen.json')).json();
    const sixteenPlusData = await (await fetch('sixteenPlus.json')).json();
    const fiftyPlusData = await (await fetch('fiftyPlus.json')).json();
    const seventyPlusData = await (await fetch('seventyPlus.json')).json();

    let data = twelvePlusData;

    // get elems
    const dayDisplay = document.getElementById('day');
    const control = document.getElementById('control');
    const playButton = document.getElementById('play');
    const twelvePlusElem = document.getElementById('twelvePlus');
    const twelveToFifteenElem = document.getElementById('twelveToFifteen');
    const sixteenPlusElem = document.getElementById('sixteenPlus');
    const fiftyPlusElem = document.getElementById('fiftyPlus');
    const seventyPlusElem = document.getElementById('seventyPlus');

	const states = ["nsw", "vic", "qld", "act", "wa", "sa", "tas", "nt"];

	let horses = {};
	for (var i = 0; i < states.length; i++) {
		horses[states[i]] = document.getElementById(states[i]);
	}

    let reset = (newDay, setPlaying) => {
        // set control minmax
        control.min = 0;
        control.max = data.length - 1;
        control.value = newDay || 0;
        day = newDay || 0;
        previousDay = -1;

        if(setPlaying) {
            playButton.className = 'playing';
            playing = true;
        }
    };

    reset();

    // event listeners
    control.addEventListener('input', () => {
        day = parseFloat(control.value);
    });


    playButton.addEventListener('click', (e) => {
        e.preventDefault();
        playing = !playing;
        playButton.className = playing ? 'playing': 'paused';
        if(day >= data.length - 1) reset(null, true);
    });

    const removeToggleClass = () => {
        [...document.querySelectorAll('.data_selector div')].forEach(ii => {
            ii.className = '';
        });
    };

    const handler = (newData) => (e) => {
        e.preventDefault();
        removeToggleClass();
        e.target.className = 'active';
        const currentDate = data[Math.floor(day)].date;
        const newDateIndex = newData.findIndex(ii => ii.date === currentDate);
        data = newData;
        if(newDateIndex !== -1) {
            reset(newDateIndex);
        } else {
            reset();
        }
    };

    twelvePlusElem.addEventListener('click', handler(twelvePlusData));
    twelveToFifteenElem.addEventListener('click', handler(twelveToFifteenData));
    sixteenPlusElem.addEventListener('click', handler(sixteenPlusData));
    fiftyPlusElem.addEventListener('click', handler(fiftyPlusData));
    seventyPlusElem.addEventListener('click', handler(seventyPlusData));


    // anim loop
    function step() {
        // increment the frame
        if(playing) {
            if(day < data.length - 1) {
                day = day + speed;
                control.value = day;
            } else {
                playing = false;
                playButton.className = 'paused';
            }
        }


        // Don't update if nothing has changed
        if(previousDay === day) {
            window.requestAnimationFrame(step)
            return;
        };
        const frame = Math.round((day / speed) * animSpeed) % 6;
        const dd = data[Math.floor(day)];
        const nd = data[Math.floor(day) + 1] || dd;
        const rt = day - Math.floor(day);

        dayDisplay.textContent = luxon.DateTime.fromISO(dd.date).toLocaleString(luxon.DateTime.DATE_MED);

		for (var i = 0; i < states.length; i++) {
			var state = states[i];

			horses[state].className = `horse frame${frame}`;
			horses[state].style.left = toPercent(lerp(dd[state+"_second_percent"], nd[state+"_second_percent"], rt));
			horses[state].style.right = toInvPercent(lerp(dd[state+"_first_percent"], nd[state+"_first_percent"], rt));
		}

        previousDay = day;
        window.requestAnimationFrame(step);
    }


    window.requestAnimationFrame(step);

})();