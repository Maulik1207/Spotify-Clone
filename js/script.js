console.log("Let's write javascript")
let currentSong = new Audio;
let songs;
let currFolder;
async function getSong(folder) {
    currFolder = folder;

    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();
    // console.log(response);
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    // console.log(as)

    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }


    }

    // show all song  in playlist
    let songUl = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUl.innerHTML = ""
    for (const song of songs) {
        songUl.innerHTML = songUl.innerHTML + ` <li>
                            <img class="invert" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                <div>Suno AI</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div>
                       </li>`
    }

    //attech an event listner to all song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    });

    return songs;




}
const playMusic = (track, pause = false) => {
    // let audio = new Audio("/songs/" + track);
    currentSong.src = (`/${currFolder}/` + track);
    if (!pause) {

        currentSong.play()
        play.src = "img/pause.svg";
    }


    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"




}
// Automatically play the next song when the current one ends
currentSong.addEventListener("ended", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if ((index + 1) < songs.length) {
        playMusic(songs[index + 1]);
    } else {
        // Optionally, you can reset to the first song in the playlist
        playMusic(songs[0]);
    }
});


async function displayAlbum() {
    try {
        let response = await fetch(`http://127.0.0.1:5500/songs`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let html = await response.text();

        let div = document.createElement("div");
        div.innerHTML = html;
        let as = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        let array = Array.from(as);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];

            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-1)[0];

                try {
                    let metadataResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    if (!metadataResponse.ok) {
                        throw new Error('Metadata fetch failed');
                    }
                    let metadata = await metadataResponse.json();

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="cards">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="32" height="32">
                                    <circle cx="14" cy="14" r="14" fill="green"/>
                                    <polygon points="11,9 19,14 11,19" fill="black"/>
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpeg" alt="">
                            <h2>${metadata.title}</h2>
                            <p>${metadata.description}</p>
                        </div>`;



                } catch (error) {
                    console.error(`Error fetching metadata for folder ${folder}:`, error);
                }
            }
        }



        // Load the playlist whenever a card is clicked
        Array.from(document.getElementsByClassName("cards")).forEach(e => {
            e.addEventListener("click", async item => {
                let folder = item.currentTarget.dataset.folder;
                try {
                    let songs = await getSong(`songs/${folder}`);
                    // Use the songs data as needed
                    console.log(songs);
                    playMusic(songs[0])
                } catch (error) {
                    console.error(`Error fetching songs for folder ${folder}:`, error);
                }
            });
        });



    } catch (error) {
        console.error('Error displaying albums:', error);
    }


}

function formatTime(seconds) {
    seconds = Math.floor(seconds);  // Ensure seconds are rounded down to the nearest whole number
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
async function main() {
    // Get all albums
    await displayAlbum();

    // Automatically load songs from the first album
    const firstAlbumCard = document.querySelector(".cardContainer .cards");
    if (firstAlbumCard) {
        const folder = firstAlbumCard.dataset.folder;
        await getSong(`songs/${folder}`);
        playMusic(songs[0], true);

        // Now the song list is populated with the first album's songs
        // You don't call playMusic here, so no song will be played automatically
    }

    //attech an event listner to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    previous.addEventListener("click", () => {
        // currentSong.pause()
        console.log(currentSong)
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        // currentSong.pause()
        console.log(currentSong)
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    //listen for time update evvent
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration)
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = ((currentSong.currentTime) / (currentSong.duration)) * 100 + "%"
    })


    // for seekbar movment
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%"
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;

    })

    // hamburger event listner
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // close button event listner
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // volume button event listner
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
        console.log("Setting volume to ", e.target.value, " / 100")
        currentSong.volume = parseInt(e.target.value) / 100
    })

    // mute track event listner
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })



}

main()
