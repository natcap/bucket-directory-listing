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
    if (Object.keys(latest).includes(location.hash)) {
      window.location.href = latest[location.hash]
    } else {
      console.warn(location.hash + ' is not found in latest.json');
    }
  }
}

var LATEST = 'latest.json' // a lookup for locations of latest installers
window.onhashchange = locationHashLatest()