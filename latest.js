function readLatestInstallers(latest_lookup) {
  // load json object that stores URLs for the latest installers
  let latest = fetch(latest_lookup)
    .then(function(response){
      const latest = response.json()
      return latest;
    })
  return latest;
}

async function locationHashLatest() {
  // trigger redirect to download a file given a special hash URL
  // if the URL doesn't match, load directory listing as normal.
  let latest = await readLatestInstallers(LATEST)
  if (location.hash === '#latest-invest-windows') {
    window.location.href = latest['invest-windows']
  } else if (location.hash === '#latest-invest-mac') {
    window.location.href = latest['invest-mac']
  } else if (location.hash === '#latest-invest-userguide') {
    window.location.href = latest['invest-userguide']
  } else {
    getS3Data();
  }
}

var LATEST = 'latest.json' // a lookup for locations of latest installers
window.onhashchange = locationHashLatest()