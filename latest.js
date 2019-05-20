function readLatestInstallers(latest_lookup) {
  // load json object that stores URLs for the latest installers
  let latest = fetch(latest_lookup)
    .then(function(response){
      if (response.status === 200){
        return response.json()
      } else {
        console.warn(response.status);
      }
    })
  return latest;
}

async function locationHashLatest() {
  // trigger redirect to download a file given a special hash URL
  // if the URL doesn't match, load directory listing as normal.
  let latest = await readLatestInstallers(LATEST)
  if (typeof latest !== 'undefined') {
    if (location.hash === '#latest-invest-windows') {
      window.location.href = latest['invest-windows']
    } else if (location.hash === '#latest-invest-mac') {
      window.location.href = latest['invest-mac']
    } else if (location.hash === '#latest-invest-userguide') {
      window.location.href = latest['invest-userguide']
    }  
  }
}

var LATEST = 'latest.json' // a lookup for locations of latest installers
window.onhashchange = locationHashLatest()