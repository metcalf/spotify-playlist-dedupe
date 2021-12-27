import SpotifyWebApi from 'spotify-web-api-node';
import fetch from 'node-fetch';

const accessToken = process.env.ACCESS_TOKEN;
const searchTerm = process.argv[2];

console.log(`Searching for playlists with: '${searchTerm}'`);

// credentials are optional
const spotifyApi = new SpotifyWebApi({accessToken: accessToken});

async function paginateAll(responseBody) {
    var items = responseBody.items;
    while(responseBody.next) {
        const response = await fetch(responseBody.next, {
            headers: { 'Authorization': 'Bearer ' + accessToken },
            json: true
        });
        responseBody = await response.json();

        items = items.concat(responseBody.items);
    }

    return items;
}

async function allPlaylistTracks(playlistId) {
    var items = [];

}

async function doIt() {
    const me = await spotifyApi.getMe();
    const allPlaylists = await paginateAll((await spotifyApi.getUserPlaylists(me.body.id)).body);

    const matchingPlaylists = allPlaylists.filter((item) => item.name.includes(searchTerm));

    console.log(`Got ${matchingPlaylists.length} matching playlists of ${allPlaylists.length} total`);

    const trackInfo = {}
    const trackPlaylists = {}

    for(const playlist of matchingPlaylists) {
        const playlistTracks = await paginateAll((await spotifyApi.getPlaylistTracks(playlist.id)).body);
        console.log(`${playlistTracks.length} for ${playlist.name}`);
        for(const playlistTrack of playlistTracks) {
            const track = playlistTrack.track;
            trackInfo[track.id] = track;
            trackPlaylists[track.id] ||= [];
            trackPlaylists[track.id].push(playlist.name);
        }
    }

    console.log("\nDuplicates:\n");
    for(const trackId in trackPlaylists) {
        const playlistNames = trackPlaylists[trackId];
        if(playlistNames.length < 2) {
            continue;
        }

        const track = trackInfo[trackId];
        console.log(`${track.name}: ${playlistNames.join(', ')}`);
    }
}

doIt();
