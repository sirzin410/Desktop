// selecting  all required tags or elements
const wrapper = document.querySelector(".wrapper");
musicImg = wrapper.querySelector(".img-area img");
musicName = wrapper.querySelector(".song-details .song-name");
musicArtist = wrapper.querySelector(".song-details .artist");
mainAudio = wrapper.querySelector("#main-audio");
playPauseBtn = wrapper.querySelector(".play-pause");
prevBtn = wrapper.querySelector("#prev");
nextBtn = wrapper.querySelector("#next");
progressArea = wrapper.querySelector(".progress-area");
progressBar = wrapper.querySelector(".progress-bar");
const showMoreBtn = document.querySelector("#more-music");
const musicList = document.querySelector(".music-list");
const closeBtn = document.querySelector("#close");


let musicIndex = 1;

window.addEventListener("load", () => {
    loadMusic(musicIndex); // calling load music function once window is open
    playingNow();
});

// load music function
function loadMusic(indexNumb) {
    musicName.innerText = allMusic[indexNumb - 1].name;
    musicArtist.innerText = allMusic[indexNumb - 1].artist;
    musicImg.src = `images/${allMusic[indexNumb - 1].img}.jpg`;
    mainAudio.src = `songs/${allMusic[indexNumb - 1].src}.mp3`;
    mainAudio.play();
}

//play music function 
function playMusic() {
    wrapper.classList.add("paused");
    playPauseBtn.querySelector("i").innerText = "pause";
    mainAudio.play();

}
//pause music function 
function pauseMusic() {
    wrapper.classList.remove("paused");
    playPauseBtn.querySelector("i").innerText = "play_arrow";
    mainAudio.pause();

}
//next music function
function nextMusic() {
    // increment index by 1
    musicIndex++;
    //if musicindex is greater than array length then musicindex will be 1 so the first song will play
    musicIndex > allMusic.length ? musicIndex = 1 : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();

}
//prev music function
function prevMusic() {
    // decrement index by 1
    musicIndex--;
    //if musicindex is less than 1 then musicindex will be array length so the last song will play
    musicIndex < 1 ? musicIndex = allMusic.length : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
}
// play or music button event
playPauseBtn.addEventListener("click", () => {
    const isMusicPaused = wrapper.classList.contains("paused");
    //if isMusicPaused is true then call pauseMusic else call PlayMusic
    isMusicPaused ? pauseMusic() : playMusic();
});

//next music buttn event
nextBtn.addEventListener("click", () => {
    nextMusic(); //calling next music function 
});

//prev music buttn event
prevBtn.addEventListener("click", () => {
    prevMusic(); //calling next music function 
});

//update progree bar width according to music current time at that moment
mainAudio.addEventListener("timeupdate", (e) => {
    const currentTime = e.target.currentTime; // getting current time of song
    const duration = e.target.duration; // getting total duration of song
    let progressWidth = (currentTime / duration) * 100;
    progressBar.style.width = `${progressWidth}%`;



    let musicCurrentTime = wrapper.querySelector(".current");
    musicDuration = wrapper.querySelector(".duration");

    mainAudio.addEventListener("loadeddata", () => {
        // update song total duration
        let audioDuration = mainAudio.duration;
        let totalMin = Math.floor(audioDuration / 60); // changing to minutes
        let totalSec = Math.floor(audioDuration % 60); // changing to seconds
        if (totalSec < 10) { //adding zero if seconds is less than 10
            totalSec = `0${totalSec}`;
        }
        musicDuration.innerText = `${totalMin}:${totalSec}`;

    });
    // update playing song current time
    let currentMin = Math.floor(currentTime / 60); // changing to minutes
    let currentSec = Math.floor(currentTime % 60); // changing to seconds
    if (currentSec < 10) { //adding 0 if seconds is less than 10
        currentSec = `0${currentSec}`;
    }
    musicCurrentTime.innerText = `${currentMin}:${currentSec}`;


});

// update playing song current time oaccording to the progressbar width
progressArea.addEventListener("click", (e) => {
    let progressWidthval = progressArea.clientWidth; // getting width of progress bar
    let clickedOffSetX = e.offsetX; //getting offset x value
    let songDuration = mainAudio.duration; //getting song duration


    mainAudio.currentTime = (clickedOffSetX / progressWidthval) * songDuration;
    playMusic();

});

// repeat, shuffle songs according to icon clicked
const repeatBtn = wrapper.querySelector("#repeat-plist");
repeatBtn.addEventListener("click", () => {
    // get innertext of the icon then change accordingly
    let getText = repeatBtn.innerText; // getting inner text icon
    //do different changes on diffrent icon click switch
    switch (getText) {
        case "repeat": // if this icon is repeat then change it to repeat_one
            repeatBtn.innerText = "repeat_one";
            repeatBtn.setAttribute("title", "Song looped");
            break;
        case "repeat_one": // if icon is repeat_one then change it to repeat
            repeatBtn.innerText = "shuffle";
            repeatBtn.setAttribute("title", "Playback shuffle");
            break;
        case "shuffle": //if icon is shuffle then change it to shuffle
            repeatBtn.innerText = "repeat";
            repeatBtn.setAttribute("title", "Playlist looped");
            break;

    }

});

//above code is for changing icon
// after song ended

mainAudio.addEventListener("ended", () => {
    //
    let getText = repeatBtn.innerText; // getting inner text icon
    //do different changes on diffrent icon click switch
    switch (getText) {
        case "repeat": // if this icon is repeat then we simply call the nextMusic function to the next song will play
            nextMusic();
            break;
        case "repeat_one": // if icon is repeat_one then we'll change the current playing song current time to 0 so song  will play from beginning
            mainAudio.currentTime = 0;
            loadMusic(musicIndex);
            playMusic(); //calling playmusic function
            break;
        case "shuffle": //if icon is shuffle then change it to repeat
            // generating random index between the max range of array length
            let randIndex = Math.floor((Math.random() * allMusic.length) + 1);
            do {
                randIndex = Math.floor((Math.random() * allMusic.length) + 1);
            } while (musicIndex == randIndex); // this loop runs until the next number wo'nt be the same of current music index
            musicIndex = randIndex; //passing randomindex to musicindex so random will play
            loadMusic(musicIndex); //calling loadmusic function
            playMusic(); //calling playmusic function
            break;

    }
})
closeBtn.addEventListener("click", () => {
    musicList.classList.remove("show");
});


showMoreBtn.addEventListener("click", () => {
    musicList.classList.toggle("show");
});

closeBtn.addEventListener("click", () => {
    closeBtn.click();
});

const ulTag = document.querySelector(".music-list ul");

for (let i = 0; i < allMusic.length; i++) {

    let liTag = `<li li-index="${i+1}">
                <div class="row">
                    <span>${allMusic[i].name}</span>
                    <p>${allMusic[i].artist}</p>
                </div>
                <audio class="${allMusic[i].src}" src="songs/${allMusic[i].src}.mp3"></audio>
                <span id="${allMusic[i].src}" class="audio-duration">0:00</span>
            </li>`;

    ulTag.insertAdjacentHTML("beforeend", liTag);


    let liAudioTag = ulTag.querySelector(`.${allMusic[i].src}`);
    let liAudioDurationSpan = ulTag.querySelector(`#${allMusic[i].src}`);

    liAudioTag.addEventListener("loadeddata", () => {
        let audioDuration = liAudioTag.duration;
        let totalMin = Math.floor(audioDuration / 60);
        let totalSec = Math.floor(audioDuration % 60);

        if (totalSec < 10) {
            totalSec = `0${totalSec}`;
        }


        liAudioDurationSpan.innerText = `${totalMin}:${totalSec}`;
    });
}

// select partivular song by clicking on the playlist queue
const allLitags = ulTag.querySelectorAll("li");

function playingNow() {
    for (let k = 0; k < allLitags.length; k++) {
        allLitags[k].setAttribute("onclick", "clicked(this)");


        if (allLitags[k].getAttribute("li-index") == musicIndex) {
            allLitags[k].classList.add("playing");
        } else {
            //  other songs don't keep the "playing" class
            allLitags[k].classList.remove("playing");
        }
    }

}
// function called by the click event
function clicked(element) {
    // Get the index from the clicked element
    let getLiIndex = element.getAttribute("li-index");

    // Update the  musicIndex to ensure it's a number if needed
    musicIndex = parseInt(getLiIndex);

    loadMusic(musicIndex);
    playMusic();
    playingNow();
    playSong();
}