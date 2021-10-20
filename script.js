

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


        horses.nsw.className = `horse frame${frame}`;
        horses.nsw.style.left = toPercent(lerp(dd.nsw_second_percent, nd.nsw_second_percent, rt));
        horses.nsw.style.right = toInvPercent(lerp(dd.nsw_first_percent, nd.nsw_first_percent, rt));

        horses.vic.className = `horse frame${frame}`;
        horses.vic.style.left = toPercent(lerp(dd.vic_second_percent, nd.vic_second_percent, rt));
        horses.vic.style.right = toInvPercent(lerp(dd.vic_first_percent, nd.vic_first_percent, rt));

        horses.qld.className = `horse frame${frame}`;
        horses.qld.style.left = toPercent(lerp(dd.qld_second_percent, nd.qld_second_percent, rt));
        horses.qld.style.right = toInvPercent(lerp(dd.qld_first_percent, nd.qld_first_percent, rt));

        horses.act.className = `horse frame${frame}`;
        horses.act.style.left = toPercent(lerp(dd.act_second_percent, nd.act_second_percent, rt));
        horses.act.style.right = toInvPercent(lerp(dd.act_first_percent, nd.act_first_percent, rt));

        horses.wa.className = `horse frame${frame}`;
        horses.wa.style.left = toPercent(lerp(dd.wa_second_percent, nd.wa_second_percent, rt));
        horses.wa.style.right = toInvPercent(lerp(dd.wa_first_percent, nd.wa_first_percent, rt));

        horses.sa.className = `horse frame${frame}`;
        horses.sa.style.left = toPercent(lerp(dd.sa_second_percent, nd.sa_second_percent, rt));
        horses.sa.style.right = toInvPercent(lerp(dd.sa_first_percent, nd.sa_first_percent, rt));

        horses.tas.className = `horse frame${frame}`;
        horses.tas.style.left = toPercent(lerp(dd.tas_second_percent, nd.tas_second_percent, rt));
        horses.tas.style.right = toInvPercent(lerp(dd.tas_first_percent, nd.tas_first_percent, rt));

        horses.nt.className = `horse frame${frame}`;
        horses.nt.style.left = toPercent(lerp(dd.nt_second_percent, nd.nt_second_percent, rt));
        horses.nt.style.right = toInvPercent(lerp(dd.nt_first_percent, nd.nt_first_percent, rt));

        previousDay = day;
        window.requestAnimationFrame(step);
    }


    window.requestAnimationFrame(step);

})();