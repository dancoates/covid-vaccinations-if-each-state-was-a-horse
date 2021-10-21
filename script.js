

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
    let frame = 0;
    const speed = 0.2;
    const animSpeed = 0.5;


    // get data
    const resp = await fetch('data.json');
    const rawData = await resp.json();
    const data = rawData.filter(ii => ii.date >= '2021-04-01');

    // get elems
    const dayDisplay = document.getElementById('day');
    const control = document.getElementById('control');
    const playButton = document.getElementById('play');
    const horses = {
        nsw: document.getElementById('nsw'),
        vic: document.getElementById('vic'),
        qld: document.getElementById('qld'),
        act: document.getElementById('act'),
        wa: document.getElementById('wa'),
        sa: document.getElementById('sa'),
        tas: document.getElementById('tas'),
        nt: document.getElementById('nt')
    };


    // set control minmax
    control.min = 0;
    control.max = data.length - 1;
    control.value = 0;

    // event listeners
    control.addEventListener('input', () => {
        day = parseFloat(control.value);
    });


    playButton.addEventListener('click', (e) => {
        e.preventDefault();
        playing = !playing;
        playButton.className = playing ? 'playing': 'paused';
    });


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

		for (const state in horses) {
			horses[state].className = `horse frame${frame}`;
			horses[state].style.left = toPercent(lerp(dd[state+"_second_percent"], nd[state+"_second_percent"], rt));
			horses[state].style.right = toInvPercent(lerp(dd[state+"_first_percent"], nd[state+"_first_percent"], rt));
		}

        previousDay = day;
        window.requestAnimationFrame(step);
    }


    window.requestAnimationFrame(step);

})();